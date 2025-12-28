/**
 * APIFOOTBALL.COM DATA ADAPTER
 * Reliable API source with official access.
 * Docs: https://apifootball.com/documentation/
 */

import { CONFIG } from '../config';

export const apiFootballAdapter = {
    apiKey: import.meta.env.VITE_APIFOOTBALL_KEY,

    /**
     * Fetches live (in-play) matches from APIFootball.
     */
    fetchLiveMatches: async () => {
        const url = `${CONFIG.DATA.APIFOOTBALL_API_BASE}?action=get_events&match_live=1&APIkey=${apiFootballAdapter.apiKey}`;

        try {
            console.log('[APIFOOTBALL] Fetching live matches...');
            const response = await fetch(url);
            const data = await response.json();

            // APIFootball returns { error: 404, message: "No event found!" } when no live matches
            if (data.error) {
                console.log('[APIFOOTBALL] No live matches found or API error:', data.message);
                return [];
            }

            if (!Array.isArray(data)) {
                console.warn('[APIFOOTBALL] Unexpected response format:', data);
                return [];
            }

            console.log(`[APIFOOTBALL] Found ${data.length} live matches`);

            // Normalize to our internal format
            return data.map(match => apiFootballAdapter.normalizeMatch(match));
        } catch (error) {
            console.error('[APIFOOTBALL] Fetch Error:', error);
            return [];
        }
    },

    /**
     * Normalizes an APIFootball match to our internal format.
     */
    normalizeMatch: (match) => {
        // Parse stats from the statistics array
        const stats = apiFootballAdapter.parseStats(match.statistics || []);

        return {
            id: match.match_id,
            homeTeam: match.match_hometeam_name,
            awayTeam: match.match_awayteam_name,
            leagueName: match.league_name,
            score: {
                home: parseInt(match.match_hometeam_score) || 0,
                away: parseInt(match.match_awayteam_score) || 0
            },
            minute: match.match_status || '0',
            stats: stats,
            latency: 0, // Will be calculated by dataWorker
            source: 'APIFootball'
        };
    },

    /**
     * Parses the statistics array from APIFootball.
     */
    parseStats: (statistics) => {
        const findStat = (type) => {
            const stat = statistics.find(s => s.type === type);
            return stat ? { home: parseInt(stat.home) || 0, away: parseInt(stat.away) || 0 } : { home: 0, away: 0 };
        };

        return {
            shotsOnGoal: findStat('Shots On Goal'),
            totalShots: findStat('Shots Total'),
            corners: findStat('Corners'),
            dangerousAttacks: findStat('Attacks'),
            possession: findStat('Ball Possession'),
            fouls: findStat('Fouls'),
            yellowCards: findStat('Yellow Cards'),
            redCards: findStat('Red Cards')
        };
    }
};
