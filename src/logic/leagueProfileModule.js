import { CONFIG } from '../config';

export class LeagueProfileModule {
    constructor() {
        // Historical averages (Mock for observation)
        this.profiles = {
            'Premier_League': { avgGoals: 2.8, lateGoalProb: 0.22 },
            'Super_Lig': { avgGoals: 2.6, lateGoalProb: 0.25 },
            'Bundesliga': { avgGoals: 3.1, lateGoalProb: 0.18 }
        };
    }

    getTier(leagueName) {
        const tiers = CONFIG.MODULAR_SYSTEM.LEAGUE_TIERS;
        if (tiers.TIER_1.some(l => leagueName?.includes(l))) return 1;
        if (tiers.TIER_2.some(l => leagueName?.includes(l))) return 2;
        return 3; // Default to Discovery
    }

    getProfile(leagueName) {
        if (!CONFIG.MODULAR_SYSTEM.OPTIONAL_MODULES.LEAGUE_PROFILES) {
            return { tier: this.getTier(leagueName) };
        }

        const key = Object.keys(this.profiles).find(pk => leagueName?.includes(pk.replace('_', ' '))) || 'default';

        return {
            leagueName,
            tier: this.getTier(leagueName),
            ...this.profiles[key] || { avgGoals: 2.5, lateGoalProb: 0.20 },
            observation: 'LEAGUE_TRAIT_LOGGING'
        };
    }
}

export const leagueProfileModule = new LeagueProfileModule();
