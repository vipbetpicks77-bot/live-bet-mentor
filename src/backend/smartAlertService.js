import { CONFIG } from '../config';
import { aiUsageLimiter } from './aiUsageLimiter';

class SmartAlertService {
    constructor() {
        this.activeAlerts = [];
        this.alertHistory = JSON.parse(localStorage.getItem('alert_history') || '[]');
        this.subscribers = [];
        this.lastCheckTime = {};
        this.cooldownMinutes = 5; // Don't re-alert same match within 5 mins
        this.currentUserId = null;
        this.currentTier = 'trial';
    }

    setUserContext(userId, tier) {
        this.currentUserId = userId;
        this.currentTier = tier;
    }

    /**
     * Subscribe to alerts
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all subscribers
     */
    notify(alert) {
        this.subscribers.forEach(cb => cb(alert));
    }

    /**
     * Check if match qualifies for alert
     */
    evaluateMatch(match, signal) {
        const conditions = {
            xgAdvantage: false,
            highPressure: false,
            strongConsensus: false,
            goodTiming: false,
            qualityData: false,
            strongValue: false, // NEW
            trapWarning: false  // NEW
        };

        const minute = parseInt(match.minute) || 0;
        const xgHome = match.stats?.xg?.home || 0;
        const xgAway = match.stats?.xg?.away || 0;
        const xgDiff = Math.abs(xgHome - xgAway);
        const pressure = match.observations?.pressure?.total || 0;
        const velocity = match.observations?.velocity?.trend || 'STABLE';
        const consensusCount = match.consensusReport?.totalSources || 0;
        const dqs = match.dqs || 0;

        // Integration with Scorer results (if available)
        const oppData = match.opportunityData || {};
        const oddsScore = oppData.components?.odds || 50;

        // 1. xG Advantage Check
        if (xgDiff >= 0.4) {
            conditions.xgAdvantage = true;
        }

        // 2. High Pressure Check
        if (pressure >= 55 || velocity === 'HOT') {
            conditions.highPressure = true;
        }

        // 3. Strong Consensus Check
        if (consensusCount >= 3) {
            const agreement = match.consensusReport?.agreement || {};
            const topCount = Math.max(...Object.values(agreement), 0);
            if (topCount >= 3 || (topCount >= 2 && consensusCount <= 4)) {
                conditions.strongConsensus = true;
            }
        }

        // 4. Good Timing Check (sweet spot: 55-80 minutes)
        if (minute >= 55 && minute <= 80) {
            conditions.goodTiming = true;
        }

        // 5. Quality Data Check
        if (dqs >= 0.55) {
            conditions.qualityData = true;
        }

        // 6. Value and Alpha Check (from Scorer)
        if (oddsScore >= 80) {
            conditions.strongValue = true;
        }
        if (oppData.score >= 80 && oddsScore >= 70) {
            // Alpha level = High stats + High value
            conditions.alphaValue = true;
        }

        // Count how many conditions are met
        const metConditions = Object.values(conditions).filter(Boolean).length;
        const score = metConditions / 7 * 100;

        let level = 'NORMAL';
        if (conditions.alphaValue || metConditions >= 6) level = 'ALPHA';
        else if (metConditions >= 5) level = 'ALEV';
        else if (metConditions >= 4) level = 'SICAK';

        return {
            conditions,
            metCount: metConditions,
            score,
            shouldAlert: metConditions >= 4 || conditions.alphaValue,
            alertLevel: level
        };
    }

    /**
     * Generate alert recommendation
     */
    generateRecommendation(match, evaluation) {
        const xgHome = match.stats?.xg?.home || 0;
        const xgAway = match.stats?.xg?.away || 0;
        const scoreHome = match.score?.home || 0;
        const scoreAway = match.score?.away || 0;
        const totalGoals = scoreHome + scoreAway;
        const xgTotal = xgHome + xgAway;
        const oppData = match.opportunityData || {};

        let marketKey = '';
        let marketParams = {};
        let team = '';
        let confidence = 0;

        // Determine best market with side-specific logic
        if (xgHome > xgAway + 0.3) {
            team = match.homeTeam;
            marketKey = 'market_next_goal_home';
            confidence = 65 + (xgHome - xgAway) * 10;
        } else if (xgAway > xgHome + 0.3) {
            team = match.awayTeam;
            marketKey = 'market_next_goal_away';
            confidence = 65 + (xgAway - xgHome) * 10;
        } else if (xgTotal > totalGoals + 0.5) {
            marketKey = 'market_over_goals';
            marketParams = { goals: totalGoals + 0.5 };
            confidence = 60 + (xgTotal - totalGoals) * 15;
        } else {
            marketKey = 'market_expected_goal';
            confidence = 55;
        }

        // Boost confidence if high EV value is detected
        if (oppData.valueDetected) {
            confidence += 10;
            if (evaluation.alertLevel === 'ALPHA') confidence += 5;
        }

        confidence = Math.min(95, Math.max(50, confidence));

        return {
            marketKey,
            marketParams,
            team,
            confidence: Math.round(confidence),
            isAlpha: evaluation.alertLevel === 'ALPHA',
            valueDetected: oppData.valueDetected,
            reasoning: this.buildReasoning(match, evaluation)
        };
    }

    /**
     * Build reasoning text
     */
    buildReasoning(match, evaluation) {
        const reasons = [];
        const { conditions } = evaluation;
        const oppData = match.opportunityData || {};

        if (conditions.xgAdvantage) {
            const xgHome = match.stats?.xg?.home || 0;
            const xgAway = match.stats?.xg?.away || 0;
            reasons.push({ key: 'reason_xg_diff', params: { diff: Math.abs(xgHome - xgAway).toFixed(2) } });
        }
        if (conditions.highPressure) {
            reasons.push({ key: 'reason_pressure', params: { pressure: match.observations?.pressure?.total || 0 } });
        }
        if (conditions.strongValue) {
            reasons.push({ key: 'reason_value_detected' });
        }
        if (evaluation.alertLevel === 'ALPHA') {
            reasons.push({ key: 'reason_alpha_signal' });
        }
        if (conditions.strongConsensus) {
            const agreement = match.consensusReport?.agreement || {};
            const top = Object.entries(agreement).sort((a, b) => b[1] - a[1])[0];
            if (top) {
                reasons.push({
                    key: 'reason_consensus',
                    params: { count: top[1], prediction: top[0] }
                });
            }
        }
        if (conditions.goodTiming) {
            reasons.push({ key: 'reason_critical_min', params: { minute: match.minute } });
        }

        return reasons;
    }

    /**
     * Check matches and generate alerts
     */
    checkMatches(matches, signals) {
        const now = Date.now();
        const newAlerts = [];

        matches.forEach(match => {
            const matchId = match.id;
            const signal = signals[matchId];

            // Plan-based Tier restriction for alerts
            if (this.currentTier === 'trial' && match.tier !== 1) {
                return;
            }

            // Cooldown check
            if (this.lastCheckTime[matchId] &&
                (now - this.lastCheckTime[matchId]) < this.cooldownMinutes * 60 * 1000) {
                return;
            }

            const evaluation = this.evaluateMatch(match, signal);

            if (evaluation.shouldAlert) {
                // Check Usage Limit
                const limitCheck = aiUsageLimiter.canReceiveSmartAlert(this.currentUserId, this.currentTier);
                if (!limitCheck.allowed) {
                    // Limit reached, silently skip (or log)
                    // console.log('[ALERT] Limit reached for ' + this.currentUserId);
                    this.lastCheckTime[matchId] = now; // Mark as checked to prevent retry spamming
                    return;
                }

                const recommendation = this.generateRecommendation(match, evaluation);

                const alert = {
                    id: `${matchId}_${now}`,
                    matchId,
                    timestamp: now,
                    match: `${match.homeTeam} vs ${match.awayTeam}`,
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    minute: match.minute,
                    score: `${match.score?.home || 0}-${match.score?.away || 0}`,
                    level: evaluation.alertLevel,
                    conditionsMet: evaluation.metCount,
                    conditions: evaluation.conditions,
                    recommendation,
                    status: 'PENDING' // PENDING, WON, LOST, VOID
                };

                newAlerts.push(alert);
                this.activeAlerts.push(alert);
                this.lastCheckTime[matchId] = now;

                // Save to history
                this.alertHistory.unshift(alert);
                if (this.alertHistory.length > 100) this.alertHistory.pop();
                localStorage.setItem('alert_history', JSON.stringify(this.alertHistory));

                // Record usage
                aiUsageLimiter.recordAIUsage(this.currentUserId, 'smartAlert');

                // Notify subscribers
                this.notify(alert);

                console.log('[ALERT] 🔔 New alert:', alert.match, alert.level, alert.recommendation.market);
            }
        });

        // Clean old active alerts (older than 20 mins)
        this.activeAlerts = this.activeAlerts.filter(a =>
            (now - a.timestamp) < 20 * 60 * 1000
        );

        return newAlerts;
    }

    /**
     * Update alert result after match ends
     */
    updateAlertResult(alertId, result) {
        const alert = this.alertHistory.find(a => a.id === alertId);
        if (alert) {
            alert.status = result; // 'WON', 'LOST', 'VOID'
            alert.resolvedAt = Date.now();
            localStorage.setItem('alert_history', JSON.stringify(this.alertHistory));
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        const resolved = this.alertHistory.filter(a => a.status !== 'PENDING');
        const won = resolved.filter(a => a.status === 'WON').length;
        const lost = resolved.filter(a => a.status === 'LOST').length;
        const total = won + lost;

        const byLevel = {
            ALEV: { won: 0, total: 0 },
            SICAK: { won: 0, total: 0 }
        };

        resolved.forEach(a => {
            if (a.level === 'ALEV' || a.level === 'SICAK') {
                byLevel[a.level].total++;
                if (a.status === 'WON') byLevel[a.level].won++;
            }
        });

        return {
            totalAlerts: this.alertHistory.length,
            resolved: total,
            pending: this.alertHistory.filter(a => a.status === 'PENDING').length,
            won,
            lost,
            accuracy: total > 0 ? ((won / total) * 100).toFixed(1) : 0,
            byLevel,
            last7Days: this.alertHistory.filter(a =>
                (Date.now() - a.timestamp) < 7 * 24 * 60 * 60 * 1000
            ).length
        };
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.activeAlerts;
    }

    /**
     * Get recent history (Plan-aware)
     */
    getHistory(limit = 20) {
        // Enforce Trial limit: only last 3 alerts visible
        if (this.currentTier === 'trial') {
            return this.alertHistory.slice(0, 3);
        }
        return this.alertHistory.slice(0, limit);
    }

    /**
     * Clear all data (for testing)
     */
    clearAll() {
        this.activeAlerts = [];
        this.alertHistory = [];
        this.lastCheckTime = {};
        localStorage.removeItem('alert_history');
    }
}

export const smartAlertService = new SmartAlertService();
