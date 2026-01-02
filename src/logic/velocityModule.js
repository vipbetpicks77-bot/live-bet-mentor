/**
 * VELOCITY (TREND) MODULE
 * Tracks how fast stats are increasing in the last 10 minutes.
 * 
 * SSS Açıklaması: İvme (Velocity) takipçisi, maçın "soğuyup soğumadığını" kontrol eder.
 * 30 dakika önce çekilen şutun şu anki gole etkisi azdır. Bu modül, son 10 dakikadaki 
 * aksiyonun hızına bakarak "vites arttıran" takımları yakalar.
 */
export const velocityModule = {
    calculate(history) {
        if (!history || history.length < 2) return { trend: 'NEUTRAL', score: 1.0 };

        const latest = history[0];
        // Find snapshot from approx 10 mins ago
        const tenMinsAgo = history.find(h => (Date.now() - h.timestamp) > 10 * 60 * 1000) || history[history.length - 1];

        const getAggr = (snapshot) =>
            (snapshot.stats?.shotsOnGoal?.home || 0) +
            (snapshot.stats?.shotsOnGoal?.away || 0) +
            (snapshot.stats?.corners?.home || 0) +
            (snapshot.stats?.corners?.away || 0);

        const diff = getAggr(latest) - getAggr(tenMinsAgo);

        // Interpretation
        if (diff >= 3) return { trend: 'HOT', score: 1.4, description: 'Vites Yükseldi' };
        if (diff >= 1) return { trend: 'WARMING', score: 1.2, description: 'Hareketlenme Var' };
        if (diff < 0) return { trend: 'COOLING', score: 0.8, description: 'Oyun Yavaşladı' };

        return { trend: 'STABLE', score: 1.0, description: 'Ritim Aynı' };
    }
};
