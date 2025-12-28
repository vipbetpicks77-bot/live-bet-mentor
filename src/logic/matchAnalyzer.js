import { CONFIG } from '../config';
import { xGModule } from './xGModule';
import { leagueProfileModule } from './leagueProfileModule';
import { bayesianModel } from './bayesianModel';

export const analyzeMatch = (fixture, odds) => {
    const { stats, minute, score } = fixture;

    // 1. Odds check (Requirement: No Odds = No Bet, except for Discovery)
    if (!odds || Object.keys(odds).length === 0) {
        const tier = leagueProfileModule.getTier(fixture.leagueName);
        if (tier !== 3) {
            return { verdict: 'PASS', reason: 'Eksik Oran Verisi (Odds Required)' };
        }
        // Tier 3 matches can proceed to observation without odds
    }

    // Phase 11: Modular Observational Units (Non-Destructive)
    const observations = {
        xg: xGModule.calculate(fixture),
        leagueProfile: leagueProfileModule.getProfile(fixture.leagueName),
        bayesian: null // Will be calculated after edgeScore
    };

    // 2. EdgeScore Calculation (Simple Weighted Model for MVP)
    // EdgeScore = (Momentum / Market Expectation)
    // Using SOG and Dangerous Attacks as Momentum proxies
    const totalAttacks = (stats.dangerousAttacks?.home || 0) + (stats.dangerousAttacks?.away || 0);
    const totalSOG = (stats.shotsOnGoal?.home || 0) + (stats.shotsOnGoal?.away || 0);

    // Placeholder logic for MVP
    const momentum = (totalAttacks * 0.1) + (totalSOG * 0.5);
    const marketExpectation = 1.0; // Normalized baseline
    const edgeScore = momentum / marketExpectation;

    // Phase 11: Bayesian Refinement (Observational)
    observations.bayesian = bayesianModel.refine(0.5, edgeScore);

    // 3. Counter-Argument Engine
    const counterArgs = [];
    if (minute > 85) counterArgs.push('Maç sonu yaklaşımı (Zaman riski)');
    if (score.home + score.away > 3) counterArgs.push('Yüksek skorda doyum noktası');

    // 4. Final Verdict Logic
    if (counterArgs.length >= CONFIG.DECISION.MAX_COUNTER_ARGUMENTS) {
        return {
            verdict: 'PASS',
            reason: 'Güçlü Karşı Argümanlar (Disiplin)',
            edgeScore,
            counterArgs
        };
    }

    if (edgeScore > CONFIG.DECISION.EDGE_SCORE_THRESHOLD) {
        return {
            verdict: 'BET',
            reason: 'Yüksek Momentum & Edge Tespit Edildi',
            edgeScore,
            counterArgs: counterArgs.length > 0 ? counterArgs : ['Kaleci performansı beklenenden yüksek olabilir.', 'Hava şartları sertleşiyor.'],
            recommendedStake: 0, // Will be calculated by BankrollManager
            observations
        };
    }

    return {
        verdict: 'PASS',
        reason: 'Edge Tespit Edilemedi',
        edgeScore,
        counterArgs,
        observations
    };
};
