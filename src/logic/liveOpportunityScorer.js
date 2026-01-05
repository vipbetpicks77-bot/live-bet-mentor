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
    VALUE_THRESHOLD: 0.10  // 10% implied probability edge required
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

        // Weighted total
        const totalScore = Math.round(
            dqsScore * weights.DQS +
            momentumScore * weights.MOMENTUM +
            pressureScore * weights.PRESSURE +
            xgScore * weights.XG +
            riskScore * weights.RISK +
            oddsScore * weights.ODDS
        );

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
            oddsInfo,         // NEW: Include odds data
            valueDetected: oddsScore >= 70,  // NEW: Flag for value
            components: {
                dqs: dqsScore,
                momentum: momentumScore,
                pressure: pressureScore,
                xg: xgScore,
                risk: riskScore,
                odds: oddsScore  // NEW
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
     * ENHANCED: Momentum with recency bias (last 5 min boost)
     */
    _calculateMomentumScore(match, minute) {
        let baseScore = 40;

        // Try velocity module first
        try {
            const velocity = velocityModule.calculate(match);
            if (velocity) {
                const gearMap = { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20 };
                baseScore = gearMap[velocity.gear] || 50;
            }
        } catch (e) { }

        // Fallback: Based on stats
        const stats = match.stats || {};
        const sog = (stats.shotsOnGoal?.home || 0) + (stats.shotsOnGoal?.away || 0);
        const da = (stats.dangerousAttacks?.home || 0) + (stats.dangerousAttacks?.away || 0);

        if (minute > 0) {
            const sogPerMin = sog / minute;
            const daPerMin = da / minute;
            const activityScore = Math.min(100, (sogPerMin * 40) + (daPerMin * 1.5));
            baseScore = Math.max(baseScore, activityScore);
        }

        // RECENCY BOOST: If we have recent events data
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

    _calculatePressureScore(match) {
        try {
            const pressure = pressureIndex.calculate(match);
            if (pressure?.total) {
                return Math.min(100, pressure.total);
            }
        } catch (e) { }

        const stats = match.stats || {};
        const daHome = stats.dangerousAttacks?.home || 0;
        const daAway = stats.dangerousAttacks?.away || 0;
        const total = daHome + daAway;

        if (total < 20) return 35;
        if (total < 40) return 55;
        if (total < 60) return 70;
        return Math.min(100, 75 + (total - 60) / 2);
    }

    /**
     * ENHANCED: xG with velocity tracking
     */
    _calculateXGScore(match) {
        const stats = match.stats || {};
        const xgHome = stats.xg?.home || 0;
        const xgAway = stats.xg?.away || 0;
        const totalXG = xgHome + xgAway;

        // Base score from total xG
        let baseScore;
        if (totalXG === 0) baseScore = 40;
        else if (totalXG < 0.5) baseScore = 35;
        else if (totalXG < 1.0) baseScore = 50;
        else if (totalXG < 1.5) baseScore = 65;
        else if (totalXG < 2.0) baseScore = 75;
        else if (totalXG < 3.0) baseScore = 85;
        else baseScore = 95;

        // xG velocity bonus
        const xgVelocity = this._getXGVelocity(match.id);
        if (xgVelocity > 0.1) baseScore = Math.min(100, baseScore + 15);
        else if (xgVelocity > 0.05) baseScore = Math.min(100, baseScore + 10);

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
     * NEW: Calculate odds-based value score
     */
    _calculateOddsScore(match, signal) {
        const oddsInfo = this._getMatchOdds(match);
        if (!oddsInfo) return 50;  // Neutral without odds data

        const { thresholds } = this.getConfig();
        let score = 50;

        // Calculate implied probability from odds
        const homeOdds = parseFloat(oddsInfo.home) || 0;
        const drawOdds = parseFloat(oddsInfo.draw) || 0;
        const awayOdds = parseFloat(oddsInfo.away) || 0;

        if (homeOdds <= 0 || drawOdds <= 0 || awayOdds <= 0) return 50;

        const homeProb = 1 / homeOdds;
        const drawProb = 1 / drawOdds;
        const awayProb = 1 / awayOdds;

        // Check for value based on match situation
        const stats = match.stats || {};
        const homePressure = stats.dangerousAttacks?.home || 0;
        const awayPressure = stats.dangerousAttacks?.away || 0;

        // If home is pressing hard but odds are good
        if (homePressure > awayPressure * 1.3 && homeOdds >= 2.0) {
            score += 25;  // Value detected on home
        }
        if (awayPressure > homePressure * 1.3 && awayOdds >= 2.0) {
            score += 25;  // Value detected on away
        }

        // Odds movement detection
        const oddsMovement = this._detectOddsMovement(match);
        if (oddsMovement.shortening) score += 15;  // Sharp money indicator

        // Low margin = sharp bookmaker = good signal
        const margin = homeProb + drawProb + awayProb - 1;
        if (margin < 0.05) score += 10;

        return Math.min(100, Math.round(score));
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
     * NEW: Detect if odds are shortening (sharp money indicator)
     */
    _detectOddsMovement(match) {
        const currentOdds = this._getMatchOdds(match);
        if (!currentOdds) return { shortening: false };

        const key = `${(match.homeTeam || '').toLowerCase()}_${(match.awayTeam || '').toLowerCase()}`;
        const prevOdds = this.previousOdds[key];

        if (!prevOdds) return { shortening: false };

        const homeDropped = parseFloat(currentOdds.home) < parseFloat(prevOdds.home);
        const awayDropped = parseFloat(currentOdds.away) < parseFloat(prevOdds.away);

        return { shortening: homeDropped || awayDropped };
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
        // ALEV requires high score + not declining + value indicator
        if (score >= thresholds.ALEV_THRESHOLD && trend.direction !== 'DOWN') {
            return 'ALEV';
        }

        // Can also be ALEV if score is 70+ with strong value
        if (score >= 70 && oddsScore >= 75 && trend.direction === 'UP') {
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

        // Over 2.5 suggestion with odds validation
        if (minute < 65 && xgTotal > 1.2 && totalGoals < 2) {
            if (!oddsInfo || parseFloat(oddsInfo.home) > 1.5) {
                return { market: 'OVER_25', confidence: xgTotal > 1.8 ? 'HIGH' : 'MEDIUM' };
            }
        }

        // Goal next suggestion
        if (minute >= 55 && minute < 80) {
            const sog = (stats.shotsOnGoal?.home || 0) + (stats.shotsOnGoal?.away || 0);
            if (sog >= 7 && totalGoals < 3) {
                return { market: 'GOAL_NEXT', confidence: sog >= 10 ? 'HIGH' : 'MEDIUM' };
            }
        }

        // Home/Away win with odds-based value
        const daHome = stats.dangerousAttacks?.home || 0;
        const daAway = stats.dangerousAttacks?.away || 0;

        if (daHome > daAway * 1.4 && signal?.verdict === 'BET') {
            const homeOdds = parseFloat(oddsInfo?.home || 0);
            if (homeOdds >= 1.8) {
                return { market: 'HOME_WIN', confidence: homeOdds >= 2.5 ? 'VALUE' : 'MEDIUM' };
            }
        }
        if (daAway > daHome * 1.4 && signal?.verdict === 'BET') {
            const awayOdds = parseFloat(oddsInfo?.away || 0);
            if (awayOdds >= 1.8) {
                return { market: 'AWAY_WIN', confidence: awayOdds >= 2.5 ? 'VALUE' : 'MEDIUM' };
            }
        }

        return null;
    }

    /**
     * ENHANCED: More detailed reason with odds context
     */
    _generateReason(match, signal, heatLevel, momentumScore, pressureScore, oddsScore, oddsInfo) {
        const minute = this._parseMinute(match.minute);
        const parts = [];

        if (heatLevel === 'ALEV') {
            parts.push('🔥 Yüksek aktivite');
        }

        if (momentumScore >= 75) {
            parts.push(`Güçlü momentum (${minute}')`);
        } else if (momentumScore >= 60) {
            parts.push(`İyi momentum`);
        }

        if (pressureScore >= 75) {
            parts.push('Yoğun baskı');
        }

        if (oddsScore >= 70) {
            parts.push('💰 Değer tespit edildi');
        }

        if (signal?.verdict === 'BET') {
            parts.push('✅ DQS+');
        }

        // xG velocity note
        const xgVelocity = this._getXGVelocity(match.id);
        if (xgVelocity > 0.1) {
            parts.push('📈 xG yükseliyor');
        }

        if (parts.length === 0) {
            return 'Ortalama aktivite';
        }

        return parts.join(' • ');
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
