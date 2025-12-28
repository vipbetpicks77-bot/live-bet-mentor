/**
 * SOFASCORE DATA ADAPTER
 * Focus: XHR/JSON extraction and normalization.
 */

import { CONFIG } from '../config';

export const sofaScoreAdapter = {
    /**
     * Fetches the match list for the current day.
     */
    async fetchScheduledEvents() {
        try {
            console.log('[SOFASCORE_ADAPTER] Fetching from local proxy:', CONFIG.DATA.SOFASCORE_LOCAL_PROXY_URL);
            const response = await fetch(CONFIG.DATA.SOFASCORE_LOCAL_PROXY_URL);
            if (!response.ok) throw new Error('API fetch failed');
            const data = await response.json();

            // The JSON from the scraper is already the events list
            if (data && data.events) {
                const normalized = data.events
                    .map(event => this.normalizeEvent(event))
                    .filter(event => event !== null);

                console.log(`[SOFASCORE_ADAPTER] Found ${data.events.length} total, ${normalized.length} active football matches`);
                return normalized;
            }
            return [];
        } catch (error) {
            console.error('[SOFASCORE_ADAPTER] Error fetching:', error);
            return [];
        }
    },

    /**
     * Light normalization for list view.
     */
    normalizeEvent(event) {
        if (!event) return null;

        // CRITICAL: Strict filtering to match SofaScore "Live" (Football) count
        // 1. Must be Football (ID 1)
        const sportId = event.tournament?.category?.sport?.id;
        if (sportId !== 1) return null;

        // 2. Must be In Progress (not just 'live' but actually playing)
        const statusType = event.status?.type;
        const statusDesc = (event.status?.description || '').toLowerCase();

        if (statusType !== 'inprogress') return null;
        if (statusDesc.includes('ended') || statusDesc.includes('finished') || statusDesc.includes('canceled') || statusDesc.includes('bitti')) return null;

        return {
            id: event.id,
            homeTeam: event.homeTeam?.name || 'Home',
            awayTeam: event.awayTeam?.name || 'Away',
            leagueName: event.tournament?.name || 'Unknown League',
            score: {
                home: event.homeScore?.current ?? 0,
                away: event.awayScore?.current ?? 0
            },
            minute: event.status?.description || '0\'',
            stats: {
                possession: { home: 0, away: 0 },
                shotsOnGoal: { home: 0, away: 0 },
                dangerousAttacks: { home: 0, away: 0 }
            },
            latency: 0,
            dataQuality: 'BASIC',
            source: 'SOFASCORE'
        };
    },

    /**
     * Fetches full details for a specific event.
     */
    fetchEventDetails: async (eventId) => {
        // Use local proxy to bypass 403 blocks for details and stats
        const baseUrl = 'http://localhost:3001/api/sofascore/event';
        const detailUrl = `${baseUrl}/${eventId}`;
        const statsUrl = `${baseUrl}/${eventId}/statistics`;

        try {
            const [detailRes, statsRes] = await Promise.all([
                fetch(detailUrl),
                fetch(statsUrl)
            ]);

            if (!detailRes.ok || !statsRes.ok) {
                console.warn(`[SOFASCORE] Detail/Stats not ready in cache for ${eventId} (Status: ${detailRes.status}/${statsRes.status})`);
                return null;
            }

            const detail = await detailRes.json();
            const stats = await statsRes.json();

            // Handle queued response from proxy
            if (detail.status === 'queued' || stats.status === 'queued') {
                return null;
            }

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
        const normalizedStats = {
            possession: { home: 0, away: 0 },
            shotsOnGoal: { home: 0, away: 0 },
            dangerousAttacks: { home: 0, away: 0 },
            rawStats: {}
        };

        if (stats.statistics && stats.statistics.length > 0) {
            const allStats = stats.statistics.find(s => s.period === 'ALL');
            if (allStats) {
                allStats.groups.forEach(group => {
                    group.statisticsItems.forEach(item => {
                        const name = item.name.toLowerCase();
                        const homeVal = item.home;
                        const awayVal = item.away;

                        // Clean values (remove % for possession, etc.)
                        const parseVal = (v) => parseInt(v.toString().replace('%', '')) || 0;

                        if (name.includes('possession')) {
                            normalizedStats.possession.home = parseVal(homeVal);
                            normalizedStats.possession.away = parseVal(awayVal);
                        }
                        if (name.includes('shots on target')) {
                            normalizedStats.shotsOnGoal.home = parseVal(homeVal);
                            normalizedStats.shotsOnGoal.away = parseVal(awayVal);
                        }
                        // Priority for Dangerous Attacks: 
                        // 1. "Dangerous attacks"
                        // 2. "Final third entries"
                        // 3. "Big chances" (fallback)
                        if (name === 'dangerous attacks') {
                            normalizedStats.dangerousAttacks.home = parseVal(homeVal);
                            normalizedStats.dangerousAttacks.away = parseVal(awayVal);
                        } else if (name === 'final third entries' && normalizedStats.dangerousAttacks.home === 0) {
                            normalizedStats.dangerousAttacks.home = parseVal(homeVal);
                            normalizedStats.dangerousAttacks.away = parseVal(awayVal);
                        } else if (name === 'big chances' && normalizedStats.dangerousAttacks.home === 0) {
                            normalizedStats.dangerousAttacks.home = parseVal(homeVal);
                            normalizedStats.dangerousAttacks.away = parseVal(awayVal);
                        }

                        normalizedStats.rawStats[item.name] = { home: homeVal, away: awayVal };
                    });
                });
                normalizedStats.groups = allStats.groups;
            }
        }

        return {
            id: event.id,
            homeTeam: event.homeTeam.name,
            awayTeam: event.awayTeam.name,
            leagueName: event.tournament?.name || 'Unknown League',
            score: { home: event.homeScore.current, away: event.awayScore.current },
            minute: event.status.description,
            stats: normalizedStats,
            latency: 0,
            dataQuality: 'OK',
            source: 'SOFASCORE'
        };
    }
};
