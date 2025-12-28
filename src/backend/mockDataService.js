/**
 * MOCK DATA SERVICE
 * Provides realistic mock data for testing when external APIs are unavailable.
 */

export const mockDataService = {
    /**
     * Returns mock live matches with realistic statistics.
     */
    fetchLiveMatches: async () => {
        console.log('[MOCK_DATA] Generating realistic mock matches...');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockMatches = [
            {
                id: 'mock-1',
                homeTeam: 'Manchester City',
                awayTeam: 'Liverpool',
                leagueName: 'Premier League',
                score: { home: 2, away: 1 },
                minute: "67'",
                stats: {
                    shotsOnGoal: { home: 8, away: 5 },
                    totalShots: { home: 14, away: 9 },
                    corners: { home: 6, away: 4 },
                    dangerousAttacks: { home: 52, away: 38 },
                    possession: { home: 58, away: 42 },
                    xg: { home: 1.8, away: 1.1 }
                },
                latency: 245,
                source: 'MockData'
            },
            {
                id: 'mock-2',
                homeTeam: 'Barcelona',
                awayTeam: 'Real Madrid',
                leagueName: 'LaLiga',
                score: { home: 1, away: 1 },
                minute: "45'",
                stats: {
                    shotsOnGoal: { home: 4, away: 6 },
                    totalShots: { home: 8, away: 11 },
                    corners: { home: 3, away: 5 },
                    dangerousAttacks: { home: 35, away: 42 },
                    possession: { home: 52, away: 48 },
                    xg: { home: 0.9, away: 1.3 }
                },
                latency: 312,
                source: 'MockData'
            },
            {
                id: 'mock-3',
                homeTeam: 'Galatasaray',
                awayTeam: 'Fenerbahçe',
                leagueName: 'Süper Lig',
                score: { home: 0, away: 0 },
                minute: "28'",
                stats: {
                    shotsOnGoal: { home: 2, away: 1 },
                    totalShots: { home: 5, away: 4 },
                    corners: { home: 2, away: 1 },
                    dangerousAttacks: { home: 18, away: 15 },
                    possession: { home: 55, away: 45 },
                    xg: { home: 0.4, away: 0.2 }
                },
                latency: 189,
                source: 'MockData'
            },
            {
                id: 'mock-4',
                homeTeam: 'Bayern Munich',
                awayTeam: 'Borussia Dortmund',
                leagueName: 'Bundesliga',
                score: { home: 3, away: 2 },
                minute: "78'",
                stats: {
                    shotsOnGoal: { home: 9, away: 7 },
                    totalShots: { home: 16, away: 12 },
                    corners: { home: 7, away: 5 },
                    dangerousAttacks: { home: 61, away: 45 },
                    possession: { home: 62, away: 38 },
                    xg: { home: 2.5, away: 1.8 }
                },
                latency: 278,
                source: 'MockData'
            },
            {
                id: 'mock-5',
                homeTeam: 'Juventus',
                awayTeam: 'AC Milan',
                leagueName: 'Serie A',
                score: { home: 1, away: 0 },
                minute: "55'",
                stats: {
                    shotsOnGoal: { home: 3, away: 2 },
                    totalShots: { home: 7, away: 6 },
                    corners: { home: 4, away: 3 },
                    dangerousAttacks: { home: 28, away: 22 },
                    possession: { home: 48, away: 52 },
                    xg: { home: 0.7, away: 0.5 }
                },
                latency: 234,
                source: 'MockData'
            }
        ];

        console.log(`[MOCK_DATA] Generated ${mockMatches.length} mock matches`);
        return mockMatches;
    }
};
