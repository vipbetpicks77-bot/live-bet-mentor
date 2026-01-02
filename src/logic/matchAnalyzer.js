import { CONFIG } from '../config';
import { xGModule } from './xGModule';
import { leagueProfileModule } from './leagueProfileModule';
import { bayesianModel } from './bayesianModel';
import { pressureIndex } from './pressureIndex';
import { velocityModule } from './velocityModule';

/**
 * MATCH ANALYZER (EXPERT UPGRADE)
 * Focus: High-velocity momentum and pressure detection.
 * 
 * SSS Açıklaması: Bu motor, maçın sadece o anki skoruna değil, son 10 dakikadaki 
 * "enerji değişimine" bakar. Vitesi yükselten (Velocity) ve rakibi bunaltan (Pressure) 
 * takımları yakalayarak risk-kazanç oranını optimize eder.
 */
export const analyzeMatch = (fixture, odds) => {
    const { stats, minute, score, history } = fixture;

    // 1. Odds check (Requirement: No Odds = No Bet, except for Discovery)
    if (!odds || Object.keys(odds).length === 0) {
        const tier = leagueProfileModule.getTier(fixture.leagueName);
        if (tier !== 3) {
            return { verdict: 'PASS', reason: 'Eksik Oran Verisi (Odds Required)' };
        }
    }

    // Expert Metrics Calculation
    const pressure = pressureIndex.calculate(stats);
    const velocity = velocityModule.calculate(history || []);

    const observations = {
        xg: xGModule.calculate(fixture),
        leagueProfile: leagueProfileModule.getProfile(fixture.leagueName),
        pressure,
        velocity,
        bayesian: null
    };

    // 2. Advanced EdgeScore Calculation
    // Base EdgeScore = (Pressure Total / 50) + Velocity Bonus
    // Max Pressure(100) / 50 = 2.0 Edge.
    const baseMomentum = (pressure.total / 50);
    const edgeScore = baseMomentum * (velocity.score || 1.0);

    // Bayesian Refinement (Observational)
    observations.bayesian = bayesianModel.refine(0.5, edgeScore);

    // 3. Counter-Argument Engine (Discipline Guard)
    const counterArgs = [];
    if (minute > 85) counterArgs.push('SSS: Maçın çok sonuna gelindi, varyans riskli.');
    if (score.home + score.away > 4) counterArgs.push('SSS: Maçta gol doyumuna ulaşıldı.');
    if (velocity.trend === 'COOLING') counterArgs.push('SSS: Oyun soğuyor, tempo düştü.');

    // 4. Final Verdict Logic
    if (counterArgs.length >= CONFIG.DECISION.MAX_COUNTER_ARGUMENTS) {
        return {
            verdict: 'PASS',
            reason: 'Disiplin Filtresi: Risk/Ödül Oranı Düşük',
            edgeScore,
            counterArgs,
            observations
        };
    }

    if (edgeScore > CONFIG.DECISION.EDGE_SCORE_THRESHOLD) {
        return {
            verdict: 'BET',
            reason: velocity.trend === 'HOT' ? 'DİKKAT: Vites yükseldi, gol yakın!' : 'Momentum Onaylandı',
            edgeScore,
            counterArgs: counterArgs.length > 0 ? counterArgs : ['SSS: Veriler temiz, analiz protokolü tamamlandı.'],
            recommendedStake: 0,
            observations
        };
    }

    return {
        verdict: 'PASS',
        reason: 'İvme Yetersiz: Bekleme Modu',
        edgeScore,
        counterArgs,
        observations
    };
};
