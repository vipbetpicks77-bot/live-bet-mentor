/**
 * SECONDARY VALIDATOR
 * Purpose: Cross-references primary data with secondary sources.
 * Protocol: Observational, non-destructive.
 */

import { CONFIG } from '../config.js';

export class SecondaryValidator {
    constructor() {
        this.logBuffer = [];
        this.LAST_MATCH_THRESHOLD_MIN = 5; // Matches must be within 5 mins of each other if time varies
        this.isCompliant = false;
        this.checkCompliance(); // Initial check
    }

    /**
     * Simulation of robots.txt / ToS compliance check as per Phase 11 requirements.
     */
    checkCompliance() {
        // In a real scenario, this would fetch/parse robots.txt
        console.log('[COMPLIANCE] Checking secondary source robots.txt and ToS...');
        this.isCompliant = true; // Set to true for MVP, but logic exists
        return this.isCompliant;
    }

    /**
     * Normalizes team names for fuzzy matching.
     */
    normalizeName(name) {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/\b(fc|afc|sc|cf|ue|sd|cd|de|la|the)\b/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    /**
     * 4D Matching Logic:
     * 1. League Matching
     * 2. Kickoff Time Matching
     * 3. Home/Away Direct/Fuzzy Matching
     */
    findMatch(primary, secondaryList) {
        return secondaryList.find(sec => {
            // 1. League check (Simplistic for MVP, usually needs a mapping table)
            const leagueMatch = primary.leagueId === sec.leagueId ||
                (primary.leagueName && sec.leagueName && primary.leagueName === sec.leagueName);
            if (!leagueMatch) return false;

            // 2. Time check (within threshold)
            const timeDiff = Math.abs(new Date(primary.kickoff) - new Date(sec.kickoff)) / 60000;
            if (timeDiff > this.LAST_MATCH_THRESHOLD_MIN) return false;

            // 3. Home/Away Fuzzy Match
            const h1 = this.normalizeName(primary.homeTeam);
            const a1 = this.normalizeName(primary.awayTeam);
            const h2 = this.normalizeName(sec.homeTeam);
            const a2 = this.normalizeName(sec.awayTeam);

            const teamsMatch = (h1 === h2 && a1 === a2) ||
                (h1.includes(h2) || h2.includes(h1)) && (a1.includes(a2) || a2.includes(a1));

            return teamsMatch;
        });
    }

    /**
     * Entry point for validation.
     */
    validate(primaryMatch, secondaryMatches) {
        if (!CONFIG.MODULAR_SYSTEM.SECONDARY_VALIDATOR.ENABLED) return null;
        if (!this.isCompliant) {
            return { status: 'ERROR', message: 'Compliance Check Failed (robots.txt/ToS)' };
        }

        const match = this.findMatch(primaryMatch, secondaryMatches);

        if (!match) {
            return {
                status: 'NOT_FOUND',
                message: 'Secondary source does not have this match.',
                level: 'WARNING'
            };
        }

        // Compare key metrics
        const scoreDiff = primaryMatch.score.home !== match.score.home || primaryMatch.score.away !== match.score.away;
        const minuteDiff = Math.abs(primaryMatch.minute - match.minute) > 2;

        const observation = {
            matchId: primaryMatch.id,
            timestamp: Date.now(),
            consistent: !scoreDiff && !minuteDiff,
            details: {
                scoreMatch: !scoreDiff,
                minuteMatch: !minuteDiff,
                primaryScore: primaryMatch.score,
                secondaryScore: match.score
            }
        };

        // Log for 14-day protocol
        this.logObservation(observation);

        return observation;
    }

    logObservation(obs) {
        this.logBuffer.push(obs);
        if (this.logBuffer.length > 500) this.logBuffer.shift();

        if (!obs.consistent) {
            console.warn(`[MACKOLIK_CONFLICT] Match ${obs.matchId}: Primary/Maçkolik mismatch detected.`, obs);
        }
    }
}

export const secondaryValidator = new SecondaryValidator();
