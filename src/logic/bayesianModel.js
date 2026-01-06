/**
 * BAYESIAN PROBABILITY ENGINE (PRODUCTION)
 * Updates the prior probability of a "Goal Event" based on live multi-source evidence.
 */
import { CONFIG } from '../config';

export class BayesianModel {
    /**
     * @param {number} priorProb - The initial probability (e.g. 0.5)
     * @param {Object} evidence - Evidence object containing momentum, quality, and xG
     */
    refine(priorProb, evidence = {}) {
        if (!CONFIG.MODULAR_SYSTEM.OPTIONAL_MODULES.BAYESIAN_PRICING) return null;

        const { edgeScore = 0, dqs = 0, xgRatio = 0 } = evidence;

        // Likelihood Calculation: P(Evidence | Goal) vs P(Evidence | No Goal)
        // High momentum + high data quality + xG support = Strong likelihood
        let likelihood = 0.5;

        if (edgeScore > 1.8) likelihood += 0.2;
        if (dqs > 0.7) likelihood += 0.1;
        if (xgRatio > 1.2) likelihood += 0.1;

        // P(A|B) = [P(B|A) * P(A)] / P(B)
        // posterior = (likelihood * prior) / ( (likelihood * prior) + ( (1-likelihood) * (1-prior) ) )
        const posterior = (likelihood * priorProb) / ((likelihood * priorProb) + ((1 - likelihood) * (1 - priorProb)));

        return {
            prior: priorProb,
            posterior: parseFloat(posterior.toFixed(4)),
            confidence: likelihood > 0.7 ? 'HIGH' : (likelihood > 0.5 ? 'MEDIUM' : 'LOW'),
            impact: (posterior - priorProb).toFixed(4)
        };
    }
}

export const bayesianModel = new BayesianModel();
