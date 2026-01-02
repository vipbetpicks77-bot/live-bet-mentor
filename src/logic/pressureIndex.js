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
        if (!stats) return 0;

        // Weights
        const W_SOG = 15;        // İsabetli şut her zaman en değerlidir
        const W_ATTACKS = 1.5;   // Tehlikeli ataklar baskının sürekliliğini gösterir
        const W_CORNERS = 5;     // Kornerler duran top baskısını gösterir

        const homeScore =
            ((stats.shotsOnGoal?.home || 0) * W_SOG) +
            ((stats.dangerousAttacks?.home || 0) * W_ATTACKS) +
            ((stats.corners?.home || 0) * W_CORNERS);

        const awayScore =
            ((stats.shotsOnGoal?.away || 0) * W_SOG) +
            ((stats.dangerousAttacks?.away || 0) * W_ATTACKS) +
            ((stats.corners?.away || 0) * W_CORNERS);

        // Normalize to 0-100 (Simplified max-bound)
        const normalize = (val) => Math.min(100, Math.round(val));

        return {
            home: normalize(homeScore),
            away: normalize(awayScore),
            total: normalize(homeScore + awayScore)
        };
    }
};
