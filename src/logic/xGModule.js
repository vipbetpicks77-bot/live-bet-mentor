/**
 * xG MODULE (Expected Goals)
 * Phase 11: Observational Only.
 */
import { CONFIG } from '../config';

export class XGModule {
    calculate(fixture) {
        if (!CONFIG.MODULAR_SYSTEM.OPTIONAL_MODULES.XG_ANALYSIS) return null;

        const { stats } = fixture;

        // If data source already provides xG (like RedScores), use it
        if (stats.xg) {
            return {
                ...stats.xg,
                source: 'PRIMARY_DATA',
                protocol: 'PRODUCTION'
            };
        }

        // Simplified xG calculation for Live Test fallback
        // SOG = 0.3, Dangerous Attack = 0.05, Big Chance = 0.6
        const homeXG = (stats.shotsOnGoal?.home || 0) * 0.15 +
            (stats.dangerousAttacks?.home || 0) * 0.02 +
            (stats.bigChances?.home || 0) * 0.45;

        const awayXG = (stats.shotsOnGoal?.away || 0) * 0.15 +
            (stats.dangerousAttacks?.away || 0) * 0.02 +
            (stats.bigChances?.away || 0) * 0.45;

        return {
            home: parseFloat(homeXG.toFixed(2)),
            away: parseFloat(awayXG.toFixed(2)),
            source: 'FALLBACK_CALC',
            protocol: '14_DAY_OBSERVATION'
        };
    }
}

export const xGModule = new XGModule();
