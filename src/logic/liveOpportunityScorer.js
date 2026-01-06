/**
 * LIVE OPPORTUNITY SCORER v2.0
 * Enhanced scoring system with live odds integration and dynamic weighting.
 * 
 * Heat Levels:
 * - ALEV (🔥): Score >= 80, strong upward trend + value detected
 * - SICAK (⚡): Score 55-79, positive indicators
 * - SOGUK (❄️): Score < 55, declining or weak
 * 
 * NEW FEATURES:
 * - Live odds value detection (implied probability vs actual)
 * - Time-based dynamic weights (late game = more momentum weight)
 * - Recent momentum (last 5 minutes activity boost)
 * - xG velocity tracking (xG per minute trend)
 * - Enhanced market suggestions with odds context
 */

import { CONFIG } from '../config';
import { pressureIndex } from './pressureIndex';
import { velocityModule } from './velocityModule';

// Dynamic weights based on match minute
const getWeightsForMinute = (minute) => {
    if (minute >= 75) {
        // Late game: Momentum and odds matter most
        return { DQS: 0.10, MOMENTUM: 0.35, PRESSURE: 0.20, XG: 0.10, RISK: 0.05, ODDS: 0.20 };
    }
    if (minute >= 60) {
        // Second half push: Balanced with odds emphasis
        return { DQS: 0.15, MOMENTUM: 0.30, PRESSURE: 0.20, XG: 0.10, RISK: 0.05, ODDS: 0.20 };
    }
    if (minute >= 45) {
        // Early second half: Pressure important
        return { DQS: 0.20, MOMENTUM: 0.25, PRESSURE: 0.25, XG: 0.10, RISK: 0.05, ODDS: 0.15 };
    }
    // First half: DQS and XG more important
    return { DQS: 0.25, MOMENTUM: 0.20, PRESSURE: 0.20, XG: 0.15, RISK: 0.05, ODDS: 0.15 };
};

// Default thresholds
const DEFAULT_THRESHOLDS = {
    ALEV_THRESHOLD: 80,
    SICAK_THRESHOLD: 55,
    MAX_MINUTE: 85,
    MIN_DQS: 0.35,
    VALUE_THRESHOLD: 0.15, // Required edge for Value
    ALPHA_THRESHOLD: 0.25, // Required edge for Alpha (Extreme Value)
    TRAP_DRIFT_THRESHOLD: 0.10 // If odds rise despite stats
};

class LiveOpportunityScorer {
    constructor() {
        this.previousScores = {};
        this.snapshotHistory = {};
        this.xgHistory = {};        // NEW: Track xG over time for velocity
        this.recentEvents = {};     // NEW: Track recent events for momentum
        this.liveOdds = null;       // NEW: Store live odds
        this.previousOdds = {};     // NEW: Track odds movement
    }

    /**
     * Set live odds data from OddsPortal
     * @param {Object} oddsData - { matches: [{ homeTeam, awayTeam, odds: { home, draw, away } }] }
     */
    setLiveOdds(oddsData) {
        if (oddsData?.matches) {
            // Store previous odds for movement detection
            if (this.liveOdds?.matches) {
                this.liveOdds.matches.forEach(m => {
                    const key = `${m.homeTeam.toLowerCase()}_${m.awayTeam.toLowerCase()}`;
                    this.previousOdds[key] = { ...m.odds };
                });
            }
            this.liveOdds = oddsData;
        }
    }

    /**
     * Get config values with fallbacks
     */
    getConfig() {
        const liveOppsConfig = CONFIG.MODULAR_SYSTEM?.ADVANCED_ANALYSIS?.LIVE_OPPORTUNITIES || {};
        return {
            thresholds: {
                ALEV_THRESHOLD: liveOppsConfig.ALEV_THRESHOLD || DEFAULT_THRESHOLDS.ALEV_THRESHOLD,
                SICAK_THRESHOLD: liveOppsConfig.SICAK_THRESHOLD || DEFAULT_THRESHOLDS.SICAK_THRESHOLD,
                MAX_MINUTE: liveOppsConfig.MAX_MINUTE || DEFAULT_THRESHOLDS.MAX_MINUTE,
                MIN_DQS: liveOppsConfig.MIN_DQS || DEFAULT_THRESHOLDS.MIN_DQS,
                VALUE_THRESHOLD: liveOppsConfig.VALUE_THRESHOLD || DEFAULT_THRESHOLDS.VALUE_THRESHOLD
            }
        };
    }

    /**
     * Calculate opportunity score for a single match
     */
    calculateOpportunityScore(match, signal) {
        const { thresholds } = this.getConfig();

        if (!match || !signal) {
            return this._createEmptyResult();
        }

        const matchId = match.id;
        const minute = this._parseMinute(match.minute);

        // Filter: Only matches within action window
        if (minute >= thresholds.MAX_MINUTE || minute <= 0) {
            return this._createEmptyResult('EXCLUDED_MINUTE');
        }

        // Filter: Minimum DQS requirement (lowered for more opportunities)
        const dqs = match.dqs || 0;
        if (dqs < thresholds.MIN_DQS) {
            return this._createEmptyResult('LOW_DQS');
        }

        // Get dynamic weights based on minute
        const weights = getWeightsForMinute(minute);

        // Calculate component scores (0-100 scale each)
        const dqsScore = this._calculateDQSScore(dqs);
        const momentumScore = this._calculateMomentumScore(match, minute);
        const pressureScore = this._calculatePressureScore(match);
        const xgScore = this._calculateXGScore(match);
        const riskScore = this._calculateRiskScore(signal);
        const oddsScore = this._calculateOddsScore(match, signal);

        // Determine stats readiness
        const stats = match.stats || {};
        const daTotal = (stats.dangerousAttacks?.home || 0) + (stats.dangerousAttacks?.away || 0);
        const sogTotal = (stats.shotsOnGoal?.home || 0) + (stats.shotsOnGoal?.away || 0);
        const xgTotal = (stats.xg?.home || 0) + (stats.xg?.away || 0);

        // Match is ready if it has any meaningful live stat (DA > 10 OR SOG > 2 OR xG > 0)
        const isStatsReady = daTotal > 10 || sogTotal > 2 || xgTotal > 0;

        // Weighted total
        let totalScore = Math.round(
            dqsScore * weights.DQS +
            momentumScore * weights.MOMENTUM +
            pressureScore * weights.PRESSURE +
            xgScore * weights.XG +
            riskScore * weights.RISK +
            oddsScore * weights.ODDS
        );

        // CRITICAL: Cap score if stats are not ready (Maximum 50 - SOGUK)
        if (!isStatsReady) {
            totalScore = Math.min(50, totalScore);
        }

        // Calculate trend
        const trend = this._calculateTrend(matchId, totalScore);

        // Track xG velocity
        this._updateXGHistory(matchId, match.stats?.xg);

        // Determine heat level (includes odds value factor)
        const heatLevel = this._getHeatLevel(totalScore, trend, thresholds, oddsScore);

        // Get odds info for this match
        const oddsInfo = this._getMatchOdds(match);

        // Enhanced market suggestion with odds
        const suggestedMarket = this._suggestMarket(match, signal, totalScore, oddsInfo);

        // Generate enhanced reason
        const reason = this._generateReason(match, signal, heatLevel, momentumScore, pressureScore, oddsScore, oddsInfo);

        // Store for next cycle
        this._updateHistory(matchId, totalScore);

        return {
            matchId,
            score: totalScore,
            trend: trend.direction,
            trendDelta: trend.delta,
            heatLevel,
            suggestedMarket,
            reason,
            oddsInfo,
            valueDetected: oddsScore >= 70,
            isStatsReady,      // NEW: Flag for UI
            components: {
                dqs: dqsScore,
                momentum: momentumScore,
                pressure: pressureScore,
                xg: xgScore,
                risk: riskScore,
                odds: oddsScore
            },
            excluded: false,
            minute
        };
    }

    /**
     * Get all live opportunities sorted by score
     */
    getOpportunities(matches, signalsMap) {
        if (!matches || !Array.isArray(matches)) return [];

        const opportunities = matches
            .map(match => {
                const signal = signalsMap[match.id];
                return this.calculateOpportunityScore(match, signal);
            })
            .filter(opp => !opp.excluded)
            .sort((a, b) => {
                // Primary: Value-detected matches first
                if (a.valueDetected !== b.valueDetected) {
                    return b.valueDetected ? 1 : -1;
                }
                // Secondary: Score descending
                if (b.score !== a.score) return b.score - a.score;
                // Tertiary: Trend (UP > STABLE > DOWN)
                const trendOrder = { UP: 3, STABLE: 2, DOWN: 1 };
                return (trendOrder[b.trend] || 0) - (trendOrder[a.trend] || 0);
            });

        return opportunities;
    }

    // ========== ENHANCED PRIVATE METHODS ==========

    _parseMinute(minute) {
        if (!minute) return 0;
        if (typeof minute === 'number') return minute;
        const str = minute.toString().replace(/[^0-9]/g, '');
        return parseInt(str) || 0;
    }

    _calculateDQSScore(dqs) {
        if (dqs >= 0.95) return 100;
        if (dqs >= 0.85) return 90;
        if (dqs >= 0.75) return 80;
        if (dqs >= 0.65) return 70;
        if (dqs >= 0.55) return 60;
        if (dqs >= 0.45) return 50;
        return Math.round(dqs * 100);
    }

    /**
     * ENHANCED: Momentum with side-specific bias
     */
    _calculateMomentumScore(match, minute, side = 'total') {
        let baseScore = 40;

        // Try velocity module
        try {
            const velocity = velocityModule.calculate(match);
            if (velocity) {
                const gearMap = { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20 };
                baseScore = gearMap[velocity.gear] || 50;

                // If specific side, adjust based on dominance
                if (side !== 'total' && velocity.dominantSide) {
                    if (velocity.dominantSide !== side) baseScore *= 0.6;
                }
            }
        } catch (e) { }

        // Based on stats
        const stats = match.stats || {};
        const homeSog = stats.shotsOnGoal?.home || 0;
        const awaySog = stats.shotsOnGoal?.away || 0;
        const homeDa = stats.dangerousAttacks?.home || 0;
        const awayDa = stats.dangerousAttacks?.away || 0;

        if (side === 'home') {
            const sogScore = Math.min(100, (homeSog / Math.max(1, minute)) * 200);
            const daScore = Math.min(100, (homeDa / Math.max(1, minute)) * 5);
            baseScore = (sogScore * 0.7 + daScore * 0.3);
        } else if (side === 'away') {
            const sogScore = Math.min(100, (awaySog / Math.max(1, minute)) * 200);
            const daScore = Math.min(100, (awayDa / Math.max(1, minute)) * 5);
            baseScore = (sogScore * 0.7 + daScore * 0.3);
        }

        const recentBoost = this._getRecentActivityBoost(match.id, stats);
        return Math.min(100, Math.round(baseScore + recentBoost));
    }

    /**
     * NEW: Calculate boost based on recent activity (simulated)
     */
    _getRecentActivityBoost(matchId, stats) {
        // Track current stats
        const current = {
            sog: (stats.shotsOnGoal?.home || 0) + (stats.shotsOnGoal?.away || 0),
            da: (stats.dangerousAttacks?.home || 0) + (stats.dangerousAttacks?.away || 0),
            timestamp: Date.now()
        };

        const prev = this.recentEvents[matchId];
        this.recentEvents[matchId] = current;

        if (!prev) return 0;

        // If data updated in last 60 seconds, calculate delta
        const timeDiff = (current.timestamp - prev.timestamp) / 1000;
        if (timeDiff < 5 || timeDiff > 120) return 0;

        const sogDelta = current.sog - prev.sog;
        const daDelta = current.da - prev.da;

        // Recent activity boost (max 20 points)
        return Math.min(20, sogDelta * 10 + daDelta * 2);
    }

    _calculatePressureScore(match, side = 'total') {
        try {
            const pressure = pressureIndex.calculate(match);
            if (pressure) {
                if (side === 'home') return pressure.home || 0;
                if (side === 'away') return pressure.away || 0;
                return pressure.total || 0;
            }
        } catch (e) { }

        const stats = match.stats || {};
        if (side === 'home') return Math.min(100, (stats.dangerousAttacks?.home || 0) * 1.5);
        if (side === 'away') return Math.min(100, (stats.dangerousAttacks?.away || 0) * 1.5);

        const total = (stats.dangerousAttacks?.home || 0) + (stats.dangerousAttacks?.away || 0);
        return Math.min(100, total * 0.8);
    }

    /**
     * ENHANCED: xG with velocity tracking and side support
     */
    _calculateXGScore(match, side = 'total') {
        const stats = match.stats || {};
        const xgHome = stats.xg?.home || 0;
        const xgAway = stats.xg?.away || 0;

        const val = side === 'home' ? xgHome : (side === 'away' ? xgAway : xgHome + xgAway);

        let baseScore;
        if (val === 0) baseScore = 40;
        else if (val < 0.3) baseScore = 35; // Adjusted for side vs total
        else if (val < 0.8) baseScore = 60;
        else if (val < 1.5) baseScore = 80;
        else baseScore = 100;

        // Velocity bonus
        const xgVelocity = this._getXGVelocity(match.id);
        if (xgVelocity > 0.05) baseScore = Math.min(100, baseScore + 10);

        return Math.round(baseScore);
    }

    /**
     * NEW: Track xG changes over time
     */
    _updateXGHistory(matchId, xg) {
        if (!xg) return;

        const totalXG = (xg.home || 0) + (xg.away || 0);

        if (!this.xgHistory[matchId]) {
            this.xgHistory[matchId] = [];
        }

        this.xgHistory[matchId].push({
            xg: totalXG,
            timestamp: Date.now()
        });

        // Keep only last 5 entries
        if (this.xgHistory[matchId].length > 5) {
            this.xgHistory[matchId].shift();
        }
    }

    /**
     * NEW: Calculate xG velocity (xG per minute change)
     */
    _getXGVelocity(matchId) {
        const history = this.xgHistory[matchId];
        if (!history || history.length < 2) return 0;

        const oldest = history[0];
        const newest = history[history.length - 1];

        const xgDiff = newest.xg - oldest.xg;
        const timeDiffMin = (newest.timestamp - oldest.timestamp) / 60000;

        if (timeDiffMin < 1) return 0;

        return xgDiff / timeDiffMin;
    }

    _calculateRiskScore(signal) {
        if (!signal) return 50;

        if (signal.verdict === 'BET') return 85;

        const riskFilters = signal.riskFilters || {};
        const failCount = Object.values(riskFilters).filter(f => f.status === 'FAIL').length;

        if (failCount === 0) return 70;
        if (failCount === 1) return 45;
        return 25;
    }

    /**
     * ALPHA MODEL: Calculate EV-based value score
     * Compares Situation Probability (P_sit) vs Market Implied Probability (P_mkt)
     */
    _calculateOddsScore(match, signal) {
        const oddsInfo = this._getMatchOdds(match);
        if (!oddsInfo) return 50;

        const { thresholds } = this.getConfig();
        const stats = match.stats || {};

        // 1. Get Market Probability (P_mkt)
        const homeOdds = parseFloat(oddsInfo.home) || 0;
        const drawOdds = parseFloat(oddsInfo.draw) || 0;
        const awayOdds = parseFloat(oddsInfo.away) || 0;
        if (homeOdds <= 1 || awayOdds <= 1) return 50;

        const pMktHome = 1 / homeOdds;
        const pMktAway = 1 / awayOdds;

        // 2. Derive Situational Probability (P_sit) from stats (0.0 - 1.0)
        // High weights on Pressure and Momentum
        const pSitHome = (this._calculatePressureScore(match, 'home') * 0.4 +
            this._calculateMomentumScore(match, 'home') * 0.4 +
            this._calculateXGScore(match, 'home') * 0.2) / 100;

        const pSitAway = (this._calculatePressureScore(match, 'away') * 0.4 +
            this._calculateMomentumScore(match, 'away') * 0.4 +
            this._calculateXGScore(match, 'away') * 0.2) / 100;

        // 3. Calculate Expected Value (EV)
        const evHome = (pSitHome * homeOdds) - 1;
        const evAway = (pSitAway * awayOdds) - 1;

        // 4. Trap Detection: Drifting Odds
        const movement = this._detectOddsMovement(match);
        let trapPenalty = 0;
        // If stats are great for home but home odds are rising (drifting)
        if (pSitHome > 0.6 && movement.homeWeight > 0.05) {
            trapPenalty = 30; // High risk of trap
        }

        // 5. Final Score Mapping
        const maxEV = Math.max(evHome, evAway);
        let valueScore = 50;

        if (maxEV > thresholds.ALPHA_THRESHOLD) valueScore = 95;
        else if (maxEV > thresholds.VALUE_THRESHOLD) valueScore = 80;
        else if (maxEV > 0) valueScore = 65;
        else if (maxEV < -0.2) valueScore = 30;

        return Math.max(0, valueScore - trapPenalty);
    }

    /**
     * NEW: Get odds for a specific match
     */
    _getMatchOdds(match) {
        if (!this.liveOdds?.matches) return null;

        const homeClean = (match.homeTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const awayClean = (match.awayTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        const found = this.liveOdds.matches.find(o => {
            const oHomeClean = (o.homeTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const oAwayClean = (o.awayTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            return (oHomeClean.includes(homeClean) || homeClean.includes(oHomeClean)) &&
                (oAwayClean.includes(awayClean) || awayClean.includes(oAwayClean));
        });

        return found?.odds || null;
    }

    /**
     * NEW: Detect if odds are shortening (sharp) or drifting (trap)
     */
    _detectOddsMovement(match) {
        const currentOdds = this._getMatchOdds(match);
        if (!currentOdds) return { shortening: false, homeWeight: 0, awayWeight: 0 };

        const key = `${(match.homeTeam || '').toLowerCase()}_${(match.awayTeam || '').toLowerCase()}`;
        const prevOdds = this.previousOdds[key];

        if (!prevOdds) return { shortening: false, homeWeight: 0, awayWeight: 0 };

        const homeWeight = parseFloat(currentOdds.home) - parseFloat(prevOdds.home);
        const awayWeight = parseFloat(currentOdds.away) - parseFloat(prevOdds.away);

        return {
            shortening: homeWeight < 0 || awayWeight < 0,
            drifting: homeWeight > 0.05 || awayWeight > 0.05,
            homeWeight,
            awayWeight
        };
    }

    _calculateTrend(matchId, currentScore) {
        const prevScore = this.previousScores[matchId];

        if (prevScore === undefined) {
            return { direction: 'STABLE', delta: 0 };
        }

        const delta = currentScore - prevScore;

        if (delta >= 5) return { direction: 'UP', delta };
        if (delta <= -5) return { direction: 'DOWN', delta };
        return { direction: 'STABLE', delta };
    }

    /**
     * ENHANCED: Heat level now considers odds value
     */
    _getHeatLevel(score, trend, thresholds, oddsScore) {
        // ALPHA: Extreme Score + High Value + Positive Trend
        if (score >= 90 && oddsScore >= 80 && trend.direction !== 'DOWN') {
            return 'ALPHA';
        }

        // ALEV: High score + not declining
        if (score >= thresholds.ALEV_THRESHOLD && trend.direction !== 'DOWN') {
            return 'ALEV';
        }

        // Strong value can also push to ALEV
        if (score >= 75 && oddsScore >= 75 && trend.direction === 'UP') {
            return 'ALEV';
        }

        if (score >= thresholds.SICAK_THRESHOLD) {
            return 'SICAK';
        }

        return 'SOGUK';
    }

    /**
     * ENHANCED: Market suggestion with odds consideration
     */
    _suggestMarket(match, signal, score, oddsInfo) {
        if (score < 50) return null;

        const stats = match.stats || {};
        const minute = this._parseMinute(match.minute);
        const totalGoals = (match.score?.home || 0) + (match.score?.away || 0);
        const xgTotal = (stats.xg?.home || 0) + (stats.xg?.away || 0);

        // Over 2.5 suggestion
        if (minute < 65 && xgTotal > 1.2 && totalGoals < 2) {
            return { marketKey: 'market_over_25', confidence: xgTotal > 1.8 ? 'HIGH' : 'MEDIUM' };
        }

        // Goal next suggestion
        if (minute >= 50 && minute < 85) {
            const sog = (stats.shotsOnGoal?.home || 0) + (stats.shotsOnGoal?.away || 0);
            if (sog >= 6 && totalGoals < 4) {
                return { marketKey: 'market_goal_next', confidence: sog >= 10 ? 'HIGH' : 'MEDIUM' };
            }
        }

        // Home/Away win with odds-based value
        const daHome = stats.dangerousAttacks?.home || 0;
        const daAway = stats.dangerousAttacks?.away || 0;

        if (daHome > daAway * 1.5 && signal?.verdict === 'BET') {
            return { marketKey: 'market_home_win', confidence: 'VALUE' };
        }
        if (daAway > daHome * 1.5 && signal?.verdict === 'BET') {
            return { marketKey: 'market_away_win', confidence: 'VALUE' };
        }

        return null;
    }

    /**
     * ENHANCED: More detailed reason with odds context
     */
    _generateReason(match, signal, heatLevel, momentumScore, pressureScore, oddsScore, oddsInfo) {
        const minute = this._parseMinute(match.minute);
        const parts = [];

        if (heatLevel === 'ALPHA') {
            parts.push({ key: 'reason_alpha_signal' });
        } else if (heatLevel === 'ALEV') {
            parts.push({ key: 'reason_high_activity' });
        }

        if (momentumScore >= 75) {
            parts.push({ key: 'reason_strong_momentum', params: { minute } });
        } else if (momentumScore >= 60) {
            parts.push({ key: 'reason_good_momentum' });
        }

        if (pressureScore >= 75) {
            parts.push({ key: 'reason_high_pressure' });
        }

        if (oddsScore >= 70) {
            parts.push({ key: 'reason_value_detected' });
        }

        if (signal?.verdict === 'BET') {
            parts.push({ key: 'reason_dqs_plus' });
        }

        // xG velocity note
        const xgVelocity = this._getXGVelocity(match.id);
        if (xgVelocity > 0.1) {
            parts.push({ key: 'reason_xg_rising' });
        }

        if (parts.length === 0) {
            parts.push({ key: 'reason_avg_activity' });
        }

        return parts;
    }

    _updateHistory(matchId, score) {
        this.previousScores[matchId] = score;

        if (!this.snapshotHistory[matchId]) {
            this.snapshotHistory[matchId] = [];
        }
        this.snapshotHistory[matchId].push({
            score,
            timestamp: Date.now()
        });

        if (this.snapshotHistory[matchId].length > 10) {
            this.snapshotHistory[matchId].shift();
        }
    }

    _createEmptyResult(reason = 'NO_DATA') {
        return {
            matchId: null,
            score: 0,
            trend: 'STABLE',
            trendDelta: 0,
            heatLevel: 'SOGUK',
            suggestedMarket: null,
            reason: reason,
            oddsInfo: null,
            valueDetected: false,
            components: {},
            excluded: true
        };
    }

    /**
     * Clear history for matches no longer live
     */
    cleanup(activeMatchIds) {
        const activeSet = new Set(activeMatchIds.map(id => id.toString()));

        Object.keys(this.previousScores).forEach(id => {
            if (!activeSet.has(id.toString())) {
                delete this.previousScores[id];
                delete this.snapshotHistory[id];
                delete this.xgHistory[id];
                delete this.recentEvents[id];
            }
        });
    }
}

export const liveOpportunityScorer = new LiveOpportunityScorer();
