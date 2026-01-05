/**
 * PRESSURE INDEX MODULE
 * Calculates a 0-100 intensity score based on offensive stats.
 * 
 * SSS Açıklaması: Baskı Endeksi, sadece golü değil, golün "ayak seslerini" ölçer. 
 * Bir takımın rakip kaleyi ne kadar bunalttığını; şut, korner ve tehlikeli atakların 
 * birleşimiyle hesaplar. 70 ve üzeri puan "yoğun baskı" anlamına gelir.
 */
export const pressureIndex = {
    calculate(stats) {
        // Fallback for missing/null stats
        const s = stats || {
            shotsOnGoal: { home: 0, away: 0 },
            dangerousAttacks: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
            totalShots: { home: 0, away: 0 }
        };

        const W_SOG = 15;
        const W_ATTACKS = 1.5;
        const W_CORNERS = 5;
        const W_TOTAL_SHOTS = 3; // Fallback factor if SOG is missing

        const getScore = (side) => {
            let score = 0;

            // Primary metrics
            score += (s.shotsOnGoal?.[side] || 0) * W_SOG;
            score += (s.dangerousAttacks?.[side] || 0) * W_ATTACKS;
            score += (s.corners?.[side] || 0) * W_CORNERS;

            // Secondary fallback (Total shots)
            if ((s.shotsOnGoal?.[side] || 0) === 0) {
                score += (s.totalShots?.[side] || 0) * W_TOTAL_SHOTS;
            }

            return score;
        };

        const homeScore = getScore('home');
        const awayScore = getScore('away');

        const dominantTeam = homeScore > awayScore ? 'HOME' : (awayScore > homeScore ? 'AWAY' : 'NONE');

        const normalize = (val) => Math.min(100, Math.round(val));

        const result = {
            home: normalize(homeScore),
            away: normalize(awayScore),
            total: normalize(homeScore + awayScore),
            dominantTeam
        };

        return result;
    }
};
