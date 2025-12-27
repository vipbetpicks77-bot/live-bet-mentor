/**
 * BACKEND DATA WORKER
 * Responsibilities: API Polling, Latency Monitoring, Normalization.
 * This runs independently of the UI components.
 */

import { CONFIG } from '../config';
import { sofaScoreAdapter } from './sofaScoreAdapter';
import { secondaryValidator } from '../logic/secondaryValidator';
import { analyzeMatch } from '../logic/matchAnalyzer';
import { mackolikScraper } from './scraper';
import { HealthMonitor } from './healthMonitor';
import { leagueProfileModule } from '../logic/leagueProfileModule';
import { bankrollManager } from '../logic/bankrollManager';

class DataWorker {
    constructor() {
        this.fixtures = [];
        this.odds = {};
        this.lastUpdated = null;
        this.isRunning = false;
        this.dataSource = 'SOFASCORE'; // 'SOFASCORE' or 'RAPIDAPI'
        this.apiKey = import.meta.env.VITE_RAPIDAPI_KEY || '';
        this.healthStats = {
            lastFetch: null,
            totalDiscovered: 0,
            errorCount: 0,
            noBetCount: 0,
            dqsAbove: 0,
            dqsBelow: 0,
            frozen: true
        };
        this.decisionMode = CONFIG.DECISION.MODES.CORE_DQS;
        this.decisionLogs = [];
        this.secondaryFixtures = []; // Maçkolik Buffer
        this.healthMonitor = new HealthMonitor(); // Phase 11 Scenario 3
        this.lastFetchDuration = 0;
        this.tier3Performance = JSON.parse(localStorage.getItem('tier3_performance') || '{}');
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * Main loops for fetching data.
     */
    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.poll();
        this.startHealthMonitoring(); // Phase 11 Scenario 3
    }

    async poll() {
        while (this.isRunning) {
            try {
                if (this.dataSource === 'SOFASCORE') {
                    await this.fetchFromSofaScore();
                }

                // Phase 11: Maçkolik Polling (Validator Source)
                if (CONFIG.MODULAR_SYSTEM.SECONDARY_VALIDATOR.ENABLED) {
                    this.secondaryFixtures = await mackolikScraper.fetchLiveMatches();
                }

                this.healthStats.lastFetch = Date.now();
                this.lastUpdated = Date.now();
            } catch (error) {
                console.error('DataWorker Poll Error:', error);
                this.healthStats.errorCount++;
            }
            await new Promise(resolve => setTimeout(resolve, CONFIG.DATA.POLLING_INTERVAL_MS));
        }
    }

    startHealthMonitoring() {
        setInterval(() => {
            const snapshot = this.healthMonitor.captureSnapshot(this);
            console.log('[HEALTH_MONITOR]', snapshot);
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    getHealthReport() {
        return this.healthMonitor.getReport();
    }

    async fetchFromSofaScore() {
        const events = await sofaScoreAdapter.fetchScheduledEvents();
        // Remove static league filter, discover ALL live matches
        const liveEvents = events.filter(e => e.status.type === 'inprogress');

        const results = await Promise.all(
            liveEvents.map(e => sofaScoreAdapter.fetchEventDetails(e.id))
        );

        this.fixtures = this.normalizeFixtures(results.filter(r => r !== null));
    }

    async fetchLiveFixtures() {
        if (!this.apiKey) {
            console.warn('API Key missing. Using mock fallback.');
            return;
        }

        try {
            const response = await fetch(`https://${CONFIG.DATA.RAPIDAPI_HOST}/v3/fixtures?live=all`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.apiKey,
                    'X-RapidAPI-Host': CONFIG.DATA.RAPIDAPI_HOST
                }
            });
            const data = await response.json();
            if (data.response) {
                // Filter by Allowed Leagues (Controlled Live Test)
                const filtered = data.response.filter(item =>
                    CONFIG.DECISION.ALLOWED_LEAGUES.includes(item.league.id)
                );
                this.fixtures = this.normalizeFixtures(filtered);
            }
        } catch (error) {
            console.error('RapidAPI Fetch Error:', error);
        }
    }

    normalizeFixtures(rawFixtures) {
        let dqsAbove = 0;
        let dqsBelow = 0;

        const normalized = rawFixtures.map(f => {
            // Manage History Buffer (Last 10 snapshots)
            const existing = this.fixtures.find(old => old.id === f.id);
            const history = existing ? [...(existing.history || [])] : [];

            const dqs = this.calculateDQS(f);
            if (dqs >= CONFIG.DECISION.DQS_THRESHOLD) dqsAbove++;
            else dqsBelow++;

            // Create Snapshot
            const snapshot = {
                timestamp: Date.now(),
                dqs,
                minute: f.minute,
                score: { ...f.score },
                stats: { ...f.stats },
                latency: f.latency
            };
            history.unshift(snapshot);
            if (history.length > 10) history.pop();

            const leagueProfile = leagueProfileModule.getProfile(f.league || f.leagueName);

            return {
                ...f,
                dqs,
                tier: leagueProfile.tier,
                history,
                dataQuality: dqs >= CONFIG.DECISION.DQS_THRESHOLD ? 'OK' : 'LOW'
            };
        });

        this.healthStats.totalDiscovered = rawFixtures.length;
        this.healthStats.dqsAbove = dqsAbove;
        this.healthStats.dqsBelow = dqsBelow;

        return normalized;
    }

    calculateDQS(fixture) {
        let score = 0;
        const weights = CONFIG.DECISION.DQS_WEIGHTS;

        if (fixture.latency < 5000) score += weights.LATENCY;
        else if (fixture.latency < CONFIG.DATA.LATENCY_THRESHOLD_MS) score += weights.LATENCY * 0.5;

        const hasSOG = fixture.stats?.shotsOnGoal?.home !== 0 || fixture.stats?.shotsOnGoal?.away !== 0;
        const hasAttacks = fixture.stats?.dangerousAttacks?.home !== 0 || fixture.stats?.dangerousAttacks?.away !== 0;
        if (hasSOG && hasAttacks) score += weights.STATS_AVAILABILITY;
        else if (hasSOG || hasAttacks) score += weights.STATS_AVAILABILITY * 0.5;

        if (fixture.minute > 0) score += weights.FRESHNESS;

        return Math.round(score * 100) / 100;
    }

    /**
     * LAYER 3: RISK & DISCIPLINE FILTERS
     */
    checkRiskFilters(fixture) {
        const risk = CONFIG.DECISION.RISK;
        const filters = {
            deadMatch: { status: 'OK', reason: '', reasonKey: '' },
            momentum: { status: 'OK', reason: '', reasonKey: '' },
            lateGame: { status: 'OK', reason: '', reasonKey: '' }
        };

        const goalDiff = Math.abs(fixture.score.home - fixture.score.away);
        const minStr = typeof fixture.minute === 'string' ? fixture.minute.replace("'", "") : fixture.minute;
        const minute = parseInt(minStr) || 0;

        // A. Dead Match Filter
        if (minute >= risk.DEAD_MATCH_MIN && goalDiff >= risk.DEAD_MATCH_DIFF) {
            filters.deadMatch = {
                status: 'FAIL',
                reason: `Dk:${minute} Skor:${fixture.score.home}-${fixture.score.away} (Ölü Maç)`,
                reasonKey: 'dead_match_reason'
            };
        }

        // B. Momentum Guard
        const history = fixture.history || [];
        const momentumWindow = fixture.tier === 2 ?
            CONFIG.MODULAR_SYSTEM.LEAGUE_TIERS.SETTINGS.TIER_2_MOMENTUM_WINDOW :
            CONFIG.DECISION.RISK.MOMENTUM_WINDOW_MIN;

        if (history.length >= 3) {
            const latest = history[0];
            const older = history.find(h => (Date.now() - h.timestamp) > (momentumWindow * 60 * 1000)) || history[history.length - 1];

            const sogDiff = (latest.stats?.shotsOnGoal?.home || 0) + (latest.stats?.shotsOnGoal?.away || 0) -
                ((older.stats?.shotsOnGoal?.home || 0) + (older.stats?.shotsOnGoal?.away || 0));

            if (sogDiff <= 0 && minute > 60) {
                filters.momentum = {
                    status: 'FAIL',
                    reason: `Son ${momentumWindow}dk İsabetli Şut Yok`,
                    reasonKey: 'no_momentum_reason'
                };
            }
        }

        // C. Late Game Ban
        if (minute >= risk.LATE_GAME_BAN_MIN) {
            filters.lateGame = {
                status: 'FAIL',
                reason: 'Geç Dakika Yasaklı (85+)',
                reasonKey: 'late_game_reason'
            };
        }

        // D. Tier 2 Aggressive Dead Match
        if (fixture.tier === 2 && minute >= CONFIG.MODULAR_SYSTEM.LEAGUE_TIERS.SETTINGS.TIER_2_DEAD_MATCH_MIN && goalDiff >= 1) {
            if (filters.deadMatch.status === 'OK') {
                filters.deadMatch = {
                    status: 'FAIL',
                    reason: `Tier 2 Erken Ölü Maç Filtresi (${minute}')`,
                    reasonKey: 'dead_match_reason'
                };
            }
        }

        return filters;
    }

    getSignalForMatch(matchId) {
        const fixture = this.fixtures.find(f => f.id === matchId);
        if (!fixture) return null;

        const dqs = fixture.dqs;
        const riskFilters = this.checkRiskFilters(fixture);
        const hasRiskFail = Object.values(riskFilters).some(f => f.status === 'FAIL');

        let verdict = 'PASS';
        let mainReason = '';
        let reasonKey = '';

        const bankrollState = bankrollManager.getState();
        if (bankrollState.current_mode === CONFIG.BANKROLL.HIERARCHY.MODES.NO_BET) {
            verdict = 'PASS';
            mainReason = 'BANKROLL STOP (NO-BET MODE)';
            reasonKey = 'bankroll_stop';
        } else if (dqs < CONFIG.DECISION.DQS_THRESHOLD) {
            verdict = 'PASS';
            mainReason = `DQS Düşük (${dqs.toFixed(2)})`;
            reasonKey = 'low_dqs';
        } else if (fixture.tier === 3) {
            verdict = 'PASS';
            mainReason = 'Tier 3: Discovery Only (No Bets)';
            reasonKey = 'tier_3_desc';
            this.trackTier3Performance(fixture);
        } else {
            // VIP Fast-Track Logic: If Tier 1 and high momentum, lower DQS threshold slightly
            const isVipFastTrack = fixture.tier === 1 && dqs >= 0.65 && !hasRiskFail;

            if (this.decisionMode === CONFIG.DECISION.MODES.CORE_DQS || isVipFastTrack) {
                verdict = 'BET';
                mainReason = isVipFastTrack ? 'VIP Fast-Track (DQS Esnetildi)' : 'DQS Onaylandı';
                reasonKey = isVipFastTrack ? 'vip_fasttrack' : 'dqs_approved';
            } else {
                if (hasRiskFail) {
                    verdict = 'PASS';
                    const failed = Object.values(riskFilters).find(f => f.status === 'FAIL');
                    mainReason = failed.reason;
                    reasonKey = failed.reasonKey;
                } else {
                    verdict = 'BET';
                    mainReason = 'DQS + Risk Filtreleri OK';
                    reasonKey = 'full_stack_ok';
                }
            }
        }

        const signal = {
            verdict,
            mainReason,
            reasonKey,
            dqs,
            riskFilters,
            timestamp: Date.now()
        };

        // Phase 11: Modular Observations
        const matchAnalysis = analyzeMatch(fixture, fixture.odds || {});
        signal.observations = matchAnalysis.observations || {};

        // Secondary Validation (4D Match)
        if (CONFIG.MODULAR_SYSTEM.SECONDARY_VALIDATOR.ENABLED) {
            // Use the buffer populated by the poll() loop
            signal.observations.secondaryValidation = secondaryValidator.validate(fixture, this.secondaryFixtures);

            // CRITICAL: Trigger NO-BET on data conflict if validator is active
            if (signal.observations.secondaryValidation?.consistent === false) {
                signal.verdict = 'NO-BET';
                signal.mainReason = 'Maçkolik Veri Çelişkisi (Risk)';
                signal.reasonKey = 'data_conflict';
                this.healthStats.noBetCount++;
            }
        }

        this.decisionLogs.push({ matchId, ...signal });
        if (this.decisionLogs.length > 100) this.decisionLogs.shift();

        return signal;
    }

    trackTier3Performance(fixture) {
        const league = fixture.league || fixture.leagueName;
        if (!this.tier3Performance[league]) {
            this.tier3Performance[league] = { totalObserved: 0, potentialWins: 0, lastSignal: null };
        }

        // This is a simplified "Silent Win" tracker
        // In a real scenario, this would check if a goal happened after the signal
        const stats = fixture.stats;
        if (stats.shotsOnGoal.home + stats.shotsOnGoal.away > 2) {
            this.tier3Performance[league].totalObserved++;
            // Logic simulation for potential win
            if (Math.random() > 0.7) this.tier3Performance[league].potentialWins++;
        }

        localStorage.setItem('tier3_performance', JSON.stringify(this.tier3Performance));
    }

    stop() {
        this.isRunning = false;
    }
}

export const dataWorker = new DataWorker();
