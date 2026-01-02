/**
 * CONSENSUS ADAPTER
 * Normalizes external predictions and applies fuzzy logic for team matching.
 */
import { CONFIG } from '../config';

export const consensusAdapter = {
    async fetchConsensus() {
        try {
            const response = await fetch('http://localhost:3001/api/consensus');
            if (!response.ok) throw new Error('Consensus data unreachable');
            return await response.json();
        } catch (error) {
            console.error('[CONSENSUS_ADAPTER] Error:', error);
            return null;
        }
    },

    _clean(name) {
        if (!name) return "";
        return name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/\bmilano\b/g, 'milan')
            .replace(/\blisboa\b/g, 'lisbon')
            .replace(/\bpraha\b/g, 'prague')
            .replace(/\bmadeira\b/g, 'nacional') // Specific alias for CD Nacional
            .replace(/\s+vs\s+/g, ' ')
            .replace(/\s+v\s+/g, ' ')
            .replace(/\s+-\s+/g, ' ')
            // Detailed Noise words & Common suffixes
            .replace(/\b(ac|fc|sc|cf|cd|ud|sd|rc|cp|fk|as|ssc|lfc|afc|rsc|youth|u20|u19|u23|b|reserve|reserves|lisbon|lisboa|madrid|london|praha|prague|calcio|vitoria|funchal|de|of)\b/g, '')
            .replace(/\b(manchester)\b/g, 'man')
            .replace(/\b(united)\b/g, 'utd')
            .replace(/\b(saint)\b/g, 'st')
            .replace(/[^a-z0-9]/g, '');
    },

    /**
     * Fuzzy match helper to link external names to our local fixtures
     * Ex: "Man City" matches "Manchester City"
     */
    findMatchInConsensus(siteData, fixtureName) {
        if (!siteData) return null;

        const target = this._clean(fixtureName);

        // Simple fuzzy search
        return siteData.find(p => {
            const homeClean = this._clean(p.home);
            const awayClean = this._clean(p.away);
            return target.includes(homeClean) || target.includes(awayClean);
        });
    },

    getConsensusSummary(globalData, fixture, market = '1X2') {
        const report = {
            totalSources: 0,
            agreement: {},
            signals: []
        };

        Object.entries(globalData).forEach(([site, matches]) => {
            const match = this.findMatchInConsensus(matches, `${fixture.homeTeam} ${fixture.awayTeam}`);
            if (match && match.markets && match.markets[market]) {
                const mData = match.markets[market];
                report.totalSources++;
                report.signals.push({
                    site,
                    prediction: mData.pred,
                    prob: mData.prob
                });

                // Track consensus agreement
                const pred = mData.pred;
                report.agreement[pred] = (report.agreement[pred] || 0) + 1;
            }
        });

        return report;
    },

    /**
     * Get summary for ALL matches in the consensus data (Pre-match view)
     * @param {Object} globalData Ham veri
     * @param {String} selectedMarket '1X2', 'OU25', 'BTTS'
     */
    getAllConsensusSummary(globalData, selectedMarket = '1X2') {
        if (!globalData || Object.keys(globalData).length === 0) return [];

        const matchMap = {}; // Key: "homeClean_awayClean"

        Object.entries(globalData).forEach(([site, matches]) => {
            if (!Array.isArray(matches)) return;

            matches.forEach(m => {
                // Skip if this match doesn't have the selected market
                if (!m.markets || !m.markets[selectedMarket]) return;

                const mData = m.markets[selectedMarket];
                const home = m.home.trim();
                const away = m.away.trim();
                const homeClean = this._clean(home);
                const awayClean = this._clean(away);
                const key = `${homeClean}_${awayClean}`;

                if (!matchMap[key]) {
                    let cleanLeague = m.league || 'Others';
                    if (cleanLeague.includes('adsbygoogle') || cleanLeague.includes('<script')) cleanLeague = 'Others';

                    matchMap[key] = {
                        match: `${home} vs ${away}`,
                        home,
                        away,
                        league: cleanLeague,
                        predictions: {},
                        agreement: {},
                        probabilities: {},
                        tipCounts: {},
                        totalSources: 0,
                        divergence: 0,
                        isValue: false,
                        market: selectedMarket,
                        date: m.date || null,
                        time: m.time || null
                    };
                } else {
                    // Update missing date/time if this source has it
                    if (!matchMap[key].date && m.date) matchMap[key].date = m.date;
                    if (!matchMap[key].time && m.time) matchMap[key].time = m.time;

                    // Prefer cleaner league name if current one is messy
                    if (m.league && (matchMap[key].league === 'Others' || matchMap[key].league.includes('adsbygoogle'))) {
                        matchMap[key].league = m.league;
                    }
                }

                // Normalization
                let normalizedPred = mData.pred;
                if (selectedMarket === 'BTTS') {
                    if (normalizedPred.toLowerCase().includes('yes') || normalizedPred === '1') normalizedPred = 'KG Var';
                    if (normalizedPred.toLowerCase().includes('no') || normalizedPred === '0') normalizedPred = 'KG Yok';
                }
                if (selectedMarket === 'OU25') {
                    if (normalizedPred.toLowerCase().includes('over') || normalizedPred === 'O') normalizedPred = 'Üst';
                    if (normalizedPred.toLowerCase().includes('under') || normalizedPred === 'U') normalizedPred = 'Alt';
                }

                matchMap[key].predictions[site] = normalizedPred;
                if (mData.prob && mData.prob !== "0") {
                    matchMap[key].probabilities[site] = mData.prob;
                }

                if (mData.tip_count) {
                    matchMap[key].tipCounts[site] = mData.tip_count;
                }

                matchMap[key].agreement[normalizedPred] = (matchMap[key].agreement[normalizedPred] || 0) + 1;
                matchMap[key].totalSources = Object.keys(matchMap[key].predictions).length;
            });
        });

        // Post-process for Divergence and Value
        Object.values(matchMap).forEach(m => {
            const uniquePreds = Object.keys(m.agreement).length;
            m.divergence = uniquePreds > 1 ? (uniquePreds / m.totalSources) * 100 : 0;

            // Value Detection: Forebet & OLBG prob check
            const forebetProb = m.probabilities.forebet ? parseInt(m.probabilities.forebet) : 0;
            const olbgProb = m.probabilities.olbg ? parseInt(m.probabilities.olbg) : 0;

            if (forebetProb >= CONFIG.MODULAR_SYSTEM.ADVANCED_ANALYSIS.VALUE_DETECTION.MIN_CONSENSUS_PROB ||
                olbgProb >= CONFIG.MODULAR_SYSTEM.ADVANCED_ANALYSIS.VALUE_DETECTION.MIN_CONSENSUS_PROB) {
                m.isValue = true;
            }
        });

        // Sort by agreement strength
        return Object.values(matchMap)
            .filter(m => m.totalSources >= 1)
            .sort((a, b) => {
                const aMax = Math.max(...Object.values(a.agreement));
                const bMax = Math.max(...Object.values(b.agreement));
                return bMax - aMax;
            });
    }
};
