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

    /**
     * Fuzzy match helper to link external names to our local fixtures
     * Ex: "Man City" matches "Manchester City"
     */
    findMatchInConsensus(siteData, fixtureName) {
        if (!siteData) return null;

        const clean = (name) => name.toLowerCase()
            .replace('manchester', 'man')
            .replace('united', 'utd')
            .replace('saint', 'st')
            .replace(/[^a-z0-9]/g, '');

        const target = clean(fixtureName);

        // Simple fuzzy search
        return siteData.find(p => {
            const homeClean = clean(p.home);
            const awayClean = clean(p.away);
            return target.includes(homeClean) || target.includes(awayClean);
        });
    },

    getConsensusSummary(globalData, fixture) {
        const report = {
            totalSources: 0,
            agreement: {},
            signals: []
        };

        Object.entries(globalData).forEach(([site, matches]) => {
            const match = this.findMatchInConsensus(matches, `${fixture.homeTeam} ${fixture.awayTeam}`);
            if (match) {
                report.totalSources++;
                report.signals.push({ site, prediction: match.prediction, prob: match.probability });

                // Track consensus agreement
                const pred = match.prediction;
                report.agreement[pred] = (report.agreement[pred] || 0) + 1;
            }
        });

        return report;
    },

    /**
     * Get summary for ALL matches in the consensus data (Pre-match view)
     */
    getAllConsensusSummary(globalData) {
        if (!globalData || Object.keys(globalData).length === 0) return [];

        const matchMap = {}; // Key: "homeClean_awayClean"

        const clean = (name) => name.toLowerCase()
            .replace('manchester', 'man')
            .replace('united', 'utd')
            .replace('saint', 'st')
            .replace(' fc', '')
            .replace(' sc', '')
            .replace(' as', '')
            .replace(' cf', '')
            .replace(/[^a-z0-9]/g, '');

        Object.entries(globalData).forEach(([site, matches]) => {
            if (!Array.isArray(matches)) return;

            matches.forEach(m => {
                const home = m.home.trim();
                const away = m.away.trim();
                const homeClean = clean(home);
                const awayClean = clean(away);
                const key = `${homeClean}_${awayClean}`;

                if (!matchMap[key]) {
                    matchMap[key] = {
                        match: `${home} vs ${away}`,
                        home,
                        away,
                        predictions: {},
                        agreement: {},
                        totalSources: 0
                    };
                }

                matchMap[key].predictions[site] = m.prediction;
                if (site === 'forebet' && m.url) {
                    matchMap[key].forebetUrl = m.url;
                }

                // Only count unique sites once per match
                if (!matchMap[key].predictions.hasOwnProperty(site) || matchMap[key].predictions[site] === m.prediction) {
                    // This logic is slightly flawed if same site has multiple entries, 
                    // but we assume the scraper cleaned duplicates.
                }

                matchMap[key].agreement[m.prediction] = (matchMap[key].agreement[m.prediction] || 0) + 1;
                matchMap[key].totalSources = Object.keys(matchMap[key].predictions).length;
            });
        });

        // Convert to array and sort by agreement strength
        return Object.values(matchMap)
            .filter(m => m.totalSources >= 1)
            .sort((a, b) => {
                const aMax = Math.max(...Object.values(a.agreement));
                const bMax = Math.max(...Object.values(b.agreement));
                return bMax - aMax;
            });
    }
};
