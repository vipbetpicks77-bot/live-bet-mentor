/**
 * CONSENSUS ADAPTER
 * Normalizes external predictions and applies fuzzy logic for team matching.
 */
import { CONFIG } from '../config';
import { database, ref, get } from '../firebase/config';

export const consensusAdapter = {
    async fetchConsensus() {
        try {
            // Fetch from Firebase
            const snapshot = await get(ref(database, 'consensus'));
            if (!snapshot.exists()) return null;
            return snapshot.val();
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
            .replace(/\bmadeira\b/g, 'nacional')
            .replace(/\bnottm\b/g, 'nottingham')
            .replace(/\bspurs\b/g, 'tottenham')
            .replace(/\bhove albion\b/g, '') // Brighton & Hove Albion -> Brighton
            .replace(/\s+vs\s+/g, ' ')
            .replace(/\s+v\s+/g, ' ')
            .replace(/\s+-\s+/g, ' ')
            // Detailed Noise words & Common suffixes
            .replace(/\b(ac|fc|sc|cf|cd|ud|sd|rc|cp|fk|as|ssc|lfc|afc|rsc|youth|u20|u19|u23|b|reserve|reserves|lisbon|lisboa|madrid|london|praha|prague|calcio|vitoria|funchal|de|of|city|united|utd|st|saint|real|athletic|sporting|club|deportivo)\b/g, '')
            .replace(/\b(manchester)\b/g, 'man')
            .replace(/[^a-z0-9]/g, '');
    },

    _isFuzzyMatch(home1, away1, home2, away2) {
        if (!home1 || !away1 || !home2 || !away2) return false;

        const h1 = this._clean(home1);
        const a1 = this._clean(away1);
        const h2 = this._clean(home2);
        const a2 = this._clean(away2);

        const homeMatch = h1 === h2 || h1.includes(h2) || h2.includes(h1);
        const awayMatch = a1 === a2 || a1.includes(a2) || a2.includes(a1);

        return homeMatch && awayMatch;
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

    _getStandings(globalData, leagueName, teamName) {
        if (!globalData.standings) return { rank: '-', points: '-' };

        // Find the matching league using fuzzy matching
        const leagueClean = this._clean(leagueName);
        const leagueEntry = Object.entries(globalData.standings).find(([lName, table]) => {
            return this._clean(lName) === leagueClean ||
                this._clean(lName).includes(leagueClean) ||
                leagueClean.includes(this._clean(lName));
        });

        if (!leagueEntry) return { rank: '-', points: '-' };
        const leagueTable = leagueEntry[1];

        // Try exact match for team
        if (leagueTable[teamName]) return leagueTable[teamName];

        // Try fuzzy match for team
        const teamClean = this._clean(teamName);
        const match = Object.entries(leagueTable).find(([tName, data]) => {
            const tClean = this._clean(tName);
            return tClean === teamClean || tClean.includes(teamClean) || teamClean.includes(tClean);
        });

        return match ? match[1] : { rank: '-', points: '-' };
    },

    getConsensusSummary(globalData, fixture, market = '1X2') {
        const report = {
            totalSources: 0,
            agreement: {},
            signals: []
        };

        Object.entries(globalData).forEach(([site, matches]) => {
            if (!Array.isArray(matches)) return;
            const match = this.findMatchInConsensus(matches, `${fixture.homeTeam} ${fixture.awayTeam}`);
            if (match && match.markets && match.markets[market]) {
                const mData = match.markets[market];
                report.totalSources++;
                report.signals.push({
                    site,
                    prediction: mData.pred,
                    prob: mData.prob,
                    score_pred: match.score_pred, // Pass score if available
                    form: match.form // Pass form if available
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

                // Find existing match by fuzzy matching
                let key = Object.keys(matchMap).find(k => {
                    const [exHome, exAway] = k.split('_S_'); // Using a unique separator
                    return (homeClean === exHome || homeClean.includes(exHome) || exHome.includes(homeClean)) &&
                        (awayClean === exAway || awayClean.includes(exAway) || exAway.includes(awayClean));
                });

                if (!key) {
                    key = `${homeClean}_S_${awayClean}`;
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
                        scorePredictions: {},
                        odds: {}, // New: Store odds
                        ranks: { home: '-', away: '-' }, // New: Store Rank
                        points: { home: '-', away: '-' }, // New: Store Points
                        totalSources: 0,
                        divergence: 0,
                        isValue: false,
                        market: selectedMarket,
                        date: m.date || null,
                        time: m.time || null,
                        form: m.form || null // Store Home/Away form
                    };

                    // Enrich with Standings immediately
                    const hStandings = this._getStandings(globalData, cleanLeague, home);
                    const aStandings = this._getStandings(globalData, cleanLeague, away);
                    matchMap[key].ranks = { home: hStandings.rank, away: aStandings.rank };
                    matchMap[key].points = { home: hStandings.points, away: aStandings.points };
                } else {
                    // Update missing date/time if this source has it
                    if (!matchMap[key].date && m.date) matchMap[key].date = m.date;
                    if (!matchMap[key].time && m.time) matchMap[key].time = m.time;

                    // Prefer cleaner league name if current one is messy
                    const isNewLeagueBetter = m.league &&
                        (matchMap[key].league === 'Others' ||
                            matchMap[key].league.includes('adsbygoogle') ||
                            matchMap[key].league.toLowerCase().includes('maç özeti') ||
                            matchMap[key].league.toLowerCase().includes('summary') ||
                            (site === 'soccervista' && matchMap[key].league !== m.league));

                    if (isNewLeagueBetter) {
                        matchMap[key].league = m.league;
                        // Re-enrich standings if league changed
                        const hStandings = this._getStandings(globalData, m.league, home);
                        const aStandings = this._getStandings(globalData, m.league, away);
                        matchMap[key].ranks = { home: hStandings.rank, away: aStandings.rank };
                        matchMap[key].points = { home: hStandings.points, away: aStandings.points };
                    }

                    // Prefer form from a source that has it (like SoccerVista)
                    if (!matchMap[key].form && m.form) {
                        matchMap[key].form = m.form;
                    }
                }

                // Capture Odds if available (Forebet)
                if (mData.odds) {
                    matchMap[key].odds[site] = mData.odds;
                }

                // Normalization
                let normalizedPred = mData.pred;
                if (selectedMarket === 'BTTS') {
                    const p = normalizedPred.toLowerCase();
                    if (p.includes('yes') || p === '1' || p === 'kg var' || p === 'y') normalizedPred = 'KG Var';
                    if (p.includes('no') || p === '0' || p === 'kg yok' || p === 'n') normalizedPred = 'KG Yok';
                }
                if (selectedMarket === 'OU25') {
                    const p = normalizedPred.toLowerCase();
                    if (p.includes('over') || p === 'o' || p === 'üst' || p === 'üst 2.5') normalizedPred = 'Üst';
                    if (p.includes('under') || p === 'u' || p === 'alt' || p === 'alt 2.5') normalizedPred = 'Alt';
                }

                matchMap[key].predictions[site] = normalizedPred;
                if (mData.prob && mData.prob !== "0") {
                    matchMap[key].probabilities[site] = mData.prob;
                }

                if (mData.tip_count) {
                    matchMap[key].tipCounts[site] = mData.tip_count;
                }

                if (m.score_pred && m.score_pred !== "N/A") {
                    matchMap[key].scorePredictions[site] = m.score_pred;
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
