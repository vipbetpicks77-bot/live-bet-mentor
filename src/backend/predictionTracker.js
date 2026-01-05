/**
 * PREDICTION TRACKER SERVICE
 * Tracks all predictions/bets and calculates accuracy statistics.
 */

class PredictionTracker {
    constructor() {
        this.predictions = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    }

    /**
     * Record a new prediction
     */
    recordPrediction(data) {
        const prediction = {
            id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            matchId: data.matchId,
            match: data.match,
            homeTeam: data.homeTeam,
            awayTeam: data.awayTeam,
            minute: data.minute,
            scoreAtPrediction: data.score,
            market: data.market, // e.g., "Over 1.5", "Home Win", "Next Goal Home"
            prediction: data.prediction, // The actual prediction value
            confidence: data.confidence, // 0-100
            source: data.source, // 'AI', 'CONSENSUS', 'ALERT', 'MANUAL'
            dqs: data.dqs,
            xgHome: data.xgHome,
            xgAway: data.xgAway,
            consensusCount: data.consensusCount,
            status: 'PENDING', // PENDING, WON, LOST, PUSH, VOID
            finalScore: null,
            resolvedAt: null,
            profit: null // For Kelly criterion calculations later
        };

        this.predictions.unshift(prediction);

        // Keep last 200 predictions
        if (this.predictions.length > 200) {
            this.predictions = this.predictions.slice(0, 200);
        }

        this.save();
        console.log('[TRACKER] Recorded prediction:', prediction.match, prediction.market);

        return prediction;
    }

    /**
     * Update prediction result
     */
    updateResult(predictionId, result, finalScore) {
        const pred = this.predictions.find(p => p.id === predictionId);
        if (pred) {
            pred.status = result; // 'WON', 'LOST', 'PUSH', 'VOID'
            pred.finalScore = finalScore;
            pred.resolvedAt = Date.now();
            this.save();
            console.log('[TRACKER] Updated result:', pred.match, result);
        }
    }

    /**
     * Bulk update by match ID (when match ends)
     */
    updateByMatchId(matchId, finalScore) {
        const pending = this.predictions.filter(p =>
            p.matchId === matchId && p.status === 'PENDING'
        );

        pending.forEach(pred => {
            const result = this.evaluateResult(pred, finalScore);
            pred.status = result;
            pred.finalScore = finalScore;
            pred.resolvedAt = Date.now();
        });

        if (pending.length > 0) {
            this.save();
            console.log('[TRACKER] Auto-updated', pending.length, 'predictions for match', matchId);
        }
    }

    /**
     * Evaluate if prediction was correct
     */
    evaluateResult(prediction, finalScore) {
        const { market, prediction: pred } = prediction;
        const homeGoals = finalScore.home;
        const awayGoals = finalScore.away;
        const totalGoals = homeGoals + awayGoals;

        // Over/Under markets
        if (market.includes('Üst') || market.includes('Over')) {
            const line = parseFloat(market.match(/(\d+\.?\d*)/)?.[1] || 0);
            return totalGoals > line ? 'WON' : 'LOST';
        }

        if (market.includes('Alt') || market.includes('Under')) {
            const line = parseFloat(market.match(/(\d+\.?\d*)/)?.[1] || 0);
            return totalGoals < line ? 'WON' : 'LOST';
        }

        // Home/Away Win
        if (market.includes('Ev') || market.includes('Home') || market === '1') {
            return homeGoals > awayGoals ? 'WON' : 'LOST';
        }

        if (market.includes('Deplasman') || market.includes('Away') || market === '2') {
            return awayGoals > homeGoals ? 'WON' : 'LOST';
        }

        // Draw
        if (market.includes('Berabere') || market.includes('Draw') || market === 'X') {
            return homeGoals === awayGoals ? 'WON' : 'LOST';
        }

        // Next Goal Home (can't auto-evaluate, needs manual)
        if (market.includes('Sıradaki Gol')) {
            return 'PENDING'; // Needs manual resolution
        }

        // BTTS (Both Teams To Score)
        if (market.includes('KG Var') || market.includes('BTTS Yes')) {
            return homeGoals > 0 && awayGoals > 0 ? 'WON' : 'LOST';
        }

        if (market.includes('KG Yok') || market.includes('BTTS No')) {
            return homeGoals === 0 || awayGoals === 0 ? 'WON' : 'LOST';
        }

        return 'PENDING'; // Unknown market type
    }

    /**
     * Get comprehensive statistics
     */
    getStats() {
        const resolved = this.predictions.filter(p =>
            p.status === 'WON' || p.status === 'LOST'
        );
        const won = resolved.filter(p => p.status === 'WON').length;
        const lost = resolved.filter(p => p.status === 'LOST').length;
        const total = won + lost;

        // By confidence level
        const byConfidence = {
            high: { won: 0, total: 0 }, // 75+
            medium: { won: 0, total: 0 }, // 60-74
            low: { won: 0, total: 0 } // <60
        };

        resolved.forEach(p => {
            const conf = p.confidence || 50;
            const bucket = conf >= 75 ? 'high' : conf >= 60 ? 'medium' : 'low';
            byConfidence[bucket].total++;
            if (p.status === 'WON') byConfidence[bucket].won++;
        });

        // By source
        const bySource = {};
        resolved.forEach(p => {
            const src = p.source || 'UNKNOWN';
            if (!bySource[src]) bySource[src] = { won: 0, total: 0 };
            bySource[src].total++;
            if (p.status === 'WON') bySource[src].won++;
        });

        // By market type
        const byMarket = {};
        resolved.forEach(p => {
            let marketType = 'OTHER';
            if (p.market.includes('Üst') || p.market.includes('Over')) marketType = 'OVER';
            else if (p.market.includes('Alt') || p.market.includes('Under')) marketType = 'UNDER';
            else if (p.market.includes('Ev') || p.market.includes('Home') || p.market === '1') marketType = 'HOME';
            else if (p.market.includes('Deplasman') || p.market.includes('Away') || p.market === '2') marketType = 'AWAY';
            else if (p.market.includes('Gol')) marketType = 'NEXT_GOAL';

            if (!byMarket[marketType]) byMarket[marketType] = { won: 0, total: 0 };
            byMarket[marketType].total++;
            if (p.status === 'WON') byMarket[marketType].won++;
        });

        // Last 7 days
        const last7Days = this.predictions.filter(p =>
            (Date.now() - p.timestamp) < 7 * 24 * 60 * 60 * 1000
        );
        const last7Resolved = last7Days.filter(p => p.status === 'WON' || p.status === 'LOST');
        const last7Won = last7Resolved.filter(p => p.status === 'WON').length;

        // Streak calculation
        let currentStreak = 0;
        let streakType = null;
        for (const p of resolved) {
            if (streakType === null) {
                streakType = p.status;
                currentStreak = 1;
            } else if (p.status === streakType) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            total: this.predictions.length,
            resolved: total,
            pending: this.predictions.filter(p => p.status === 'PENDING').length,
            won,
            lost,
            accuracy: total > 0 ? ((won / total) * 100).toFixed(1) : 0,
            byConfidence,
            bySource,
            byMarket,
            last7Days: {
                total: last7Days.length,
                resolved: last7Resolved.length,
                won: last7Won,
                accuracy: last7Resolved.length > 0
                    ? ((last7Won / last7Resolved.length) * 100).toFixed(1)
                    : 0
            },
            streak: {
                count: currentStreak,
                type: streakType
            }
        };
    }

    /**
     * Get recent predictions
     */
    getRecent(limit = 20) {
        return this.predictions.slice(0, limit);
    }

    /**
     * Get pending predictions
     */
    getPending() {
        return this.predictions.filter(p => p.status === 'PENDING');
    }

    /**
     * Save to localStorage
     */
    save() {
        localStorage.setItem('prediction_history', JSON.stringify(this.predictions));
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.predictions = [];
        localStorage.removeItem('prediction_history');
    }

    /**
     * Export data for analysis
     */
    exportCSV() {
        const headers = ['Date', 'Match', 'Market', 'Confidence', 'Source', 'DQS', 'Status', 'Score At Pred', 'Final Score'];
        const rows = this.predictions.map(p => [
            new Date(p.timestamp).toLocaleDateString(),
            p.match,
            p.market,
            p.confidence,
            p.source,
            p.dqs?.toFixed(2) || '',
            p.status,
            p.scoreAtPrediction,
            p.finalScore ? `${p.finalScore.home}-${p.finalScore.away}` : ''
        ]);

        return [headers, ...rows].map(r => r.join(',')).join('\n');
    }
}

export const predictionTracker = new PredictionTracker();
