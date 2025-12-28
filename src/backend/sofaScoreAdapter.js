/**
 * SOFASCORE DATA ADAPTER
 * Focus: XHR/JSON extraction and normalization.
 */

import { CONFIG } from '../config';

export const sofaScoreAdapter = {
    /**
     * Fetches the match list for the current day.
     */
    fetchScheduledEvents: async () => {
        // Use live events endpoint for immediate results
        // Using local proxy /api-sofascore to bypass CORS and Cloudflare blocks
        const url = '/api-sofascore/api/v1/sport/football/events/live';

        try {
            const response = await fetch(url);
            const data = await response.json();

            // FALLBACK: Removed mock for production testing
            if (!data.events || data.events.length === 0) {
                console.log('[SOFASCORE] No live matches found in current feed');
                return [];
            }

            return data.events || [];
        } catch (error) {
            console.error('SofaScore fetchScheduledEvents Error:', error);
            return [];
        }
    },

    /**
     * Fetches full details for a specific event.
     */
    fetchEventDetails: async (eventId) => {
        if (eventId.startsWith('sim_')) {
            console.warn('[SOFASCORE] Sim match detail requested but mock data is disabled');
            return null;
        }

        // Using local proxy paths
        const detailUrl = `/api-sofascore/api/v1/event/${eventId}`;
        const statsUrl = `/api-sofascore/api/v1/event/${eventId}/statistics`;

        try {
            const [detailRes, statsRes] = await Promise.all([
                fetch(detailUrl),
                fetch(statsUrl)
            ]);

            const detail = await detailRes.json();
            const stats = await statsRes.json();

            return sofaScoreAdapter.normalize(detail, stats);
        } catch (error) {
            console.error(`SofaScore fetchEventDetails Error for ${eventId}:`, error);
            return null;
        }
    },

    /**
     * Normalizes SofaScore data to our internal schema.
     */
    normalize: (detail, stats) => {
        const event = detail.event;
        // Map SofaScore stats to our internal naming (SOG, Dangerous Attacks, etc.)
        const normalizedStats = {
            possession: { home: 0, away: 0 },
            shotsOnGoal: { home: 0, away: 0 },
            dangerousAttacks: { home: 0, away: 0 },
            rawStats: {} // Will contain ALL items from SofaScore
        };

        if (stats.statistics && stats.statistics.length > 0) {
            const allStats = stats.statistics.find(s => s.period === 'ALL');
            if (allStats) {
                allStats.groups.forEach(group => {
                    group.statisticsItems.forEach(item => {
                        // Map core metrics for internal engine
                        if (item.name === 'Ball possession') {
                            normalizedStats.possession.home = parseInt(item.home);
                            normalizedStats.possession.away = parseInt(item.away);
                        }
                        if (item.name === 'Shots on target') {
                            normalizedStats.shotsOnGoal.home = parseInt(item.home);
                            normalizedStats.shotsOnGoal.away = parseInt(item.away);
                        }
                        if (item.name === 'Big chances') {
                            normalizedStats.dangerousAttacks.home = parseInt(item.home);
                            normalizedStats.dangerousAttacks.away = parseInt(item.away);
                        }

                        // Collect EVERY item for read-only observation
                        normalizedStats.rawStats[item.name] = {
                            home: item.home,
                            away: item.away,
                            homeValue: item.homeValue,
                            awayValue: item.awayValue
                        };
                    });
                });
            }
        }

        // Dynamic Minute Calculation
        let calculatedMinute = event.status.description;
        if (event.status.type === 'inprogress') {
            const now = Math.floor(Date.now() / 1000);
            const startTimestamp = event.statusTime?.timestamp || 0;
            const initialSeconds = event.statusTime?.initial || 0;
            if (startTimestamp > 0) {
                const totalSeconds = (now - startTimestamp) + initialSeconds;
                calculatedMinute = Math.floor(totalSeconds / 60) + 1;
                // Cap at 45 for 1st half and 90 for 2nd half if SofaScore hasn't updated yet?
                // Actually, let's keep it raw for accuracy.
                calculatedMinute = `${calculatedMinute}'`;
            }
        }

        return {
            id: event.id,
            homeTeam: event.homeTeam.name,
            awayTeam: event.awayTeam.name,
            leagueName: event.tournament?.name || 'Unknown League',
            score: { home: event.homeScore.current, away: event.awayScore.current },
            minute: calculatedMinute,
            stats: normalizedStats,
            latency: 0,
            dataQuality: 'OK',
            source: 'SofaScore'
        };
    }
};
