/**
 * MOCK DATA SERVICE
 * Simulates live match data and signals for MVP development.
 */

export const MOCK_MATCHES = [
    {
        id: 'm1',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        score: { home: 1, away: 1 },
        minute: 72,
        stats: {
            possession: { home: 52, away: 48 },
            shotsOnGoal: { home: 6, away: 5 },
            dangerousAttacks: { home: 45, away: 42 }
        }
    },
    {
        id: 'm2',
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        score: { home: 0, away: 2 },
        minute: 35,
        stats: {
            possession: { home: 60, away: 40 },
            shotsOnGoal: { home: 3, away: 4 },
            dangerousAttacks: { home: 30, away: 22 }
        }
    },
    {
        id: 'm3',
        homeTeam: 'Galatasaray',
        awayTeam: 'Fenerbahçe',
        score: { home: 0, away: 0 },
        minute: 15,
        stats: {
            possession: { home: 55, away: 45 },
            shotsOnGoal: { home: 2, away: 0 },
            dangerousAttacks: { home: 12, away: 8 }
        }
    }
];

export const generateMockSignal = (match) => {
    // Simulate logic engine behavior
    const rand = Math.random();

    if (rand < 0.6) {
        return {
            matchId: match.id,
            verdict: 'PASS',
            dataQuality: 'OK',
            edgeScore: 0.85,
            reasoning: ['Yeterli baskı oluşmadı.', 'Oranlar riskli seviyede.'],
            counterArgs: ['Hava şartları değişken.', 'Tempo düşük.'],
            recommendedStake: 0
        };
    } else if (rand < 0.8) {
        return {
            matchId: match.id,
            verdict: 'BET',
            dataQuality: 'OK',
            edgeScore: 1.28,
            riskLevel: 'Medium',
            reasoning: ['Son 10 dk tehlikeli ataklarda %40 artış.', 'Deplasman yorulma işaretleri gösteriyor.'],
            counterArgs: ['Kaleci performansı yüksek.', 'Kontratak riski var.'],
            recommendedStake: 25.0
        };
    } else {
        return {
            matchId: match.id,
            verdict: 'NO-BET',
            dataQuality: 'LOW',
            latency: 45000,
            reasoning: ['Veri gecikmesi saptandı (45sn).', 'İstatistikler çelişkili.'],
            recommendedStake: 0
        };
    }
};
