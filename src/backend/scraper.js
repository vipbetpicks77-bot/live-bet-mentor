/**
 * MACKOLIK LIVE SCRAPER PROTOTYPE
 * Focus: Live scores and match data for validation.
 * 
 * NOTE: Direct scraping from client-side may require a proxy in production.
 * This prototype implements the normalization and 4D matching prep.
 */

export const mackolikScraper = {
    MACKOLIK_LIVE_ENDPOINT: 'https://arsiv.mackolik.com/Live/LiveScore.aspx',
    simulateConflict: false, // For Negative Testing (Phase 11)
    simulateFailure: false, // For Failover Testing (Scenario 2)

    /**
     * Fetches live matches from Maçkolik.
     * In a browser environment, this simulation demonstrates the data flow.
     */
    fetchLiveMatches: async () => {
        try {
            console.log('[MACKOLIK] Fetching live data prototype...');

            // Scenario 2: Simulate network failure / service unavailable
            if (mackolikScraper.simulateFailure) {
                console.warn('[MACKOLIK] Simulated failure - returning empty dataset');
                return [];
            }

            // In reality, this would be an fetch() call to their API or a proxy
            // Simulation of proxy fetch
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mackolikScraper.MACKOLIK_LIVE_ENDPOINT)}`;
            await fetch(proxyUrl); // Just to verify connectivity in prototype

            const mockMackolikData = [
                {
                    id: 'mk_123',
                    home: 'Real Madrid',
                    away: 'Barcelona',
                    score: mackolikScraper.simulateConflict ? '3 - 1' : '2 - 1', // Simulate mismatch
                    minute: '75',
                    league: 'La Liga',
                    kickoff: new Date().setHours(22, 0, 0, 0)
                },
                {
                    id: 'mk_456',
                    home: 'Galatasaray',
                    away: 'Fenerbahce',
                    score: '0 - 0',
                    minute: '18',
                    league: 'Super Lig',
                    kickoff: new Date().setHours(21, 0, 0, 0)
                }
            ];

            return mackolikScraper.normalize(mockMackolikData);
        } catch (error) {
            console.error('Maçkolik Scraper Error:', error);
            return [];
        }
    },

    /**
     * Normalizes Maçkolik data to matches our 4D Matching schema.
     */
    normalize: (rawList) => {
        return rawList.map(item => {
            const [homeScore, awayScore] = item.score.split('-').map(s => parseInt(s.trim()));

            return {
                id: item.id,
                homeTeam: item.home,
                awayTeam: item.away,
                score: { home: homeScore, away: awayScore },
                minute: item.minute,
                leagueName: item.league,
                kickoff: item.kickoff,
                source: 'Mackolik'
            };
        });
    }
};
