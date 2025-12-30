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
            minute: this.calculateMinute(event),
            stats: {
                possession: { home: 0, away: 0 },
                shotsOnGoal: { home: 0, away: 0 },
                dangerousAttacks: { home: 0, away: 0 },
                corners: { home: 0, away: 0 },
                xg: { home: 0, away: 0 }
            },
            isPartial: true,
            latency: 0,
            dataQuality: 'BASIC',
            source: 'SOFASCORE'
        };
    },

    /**
     * Fetches full details for a specific event.
     */
    fetchEventDetails: async (eventId) => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const baseUrl = `${apiBase}/api/sofascore/event`;
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
        let isPartial = false;

        const normalizedStats = {
            possession: { home: 0, away: 0 },
            shotsOnGoal: { home: 0, away: 0 },
            dangerousAttacks: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
            xg: { home: 0, away: 0 },
            cards: { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } },
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

                        const parseVal = (v) => {
                            if (typeof v === 'string') {
                                return parseFloat(v.replace('%', '')) || 0;
                            }
                            return parseFloat(v) || 0;
                        };

                        if (name.includes('possession')) {
                            normalizedStats.possession.home = parseVal(homeVal);
                            normalizedStats.possession.away = parseVal(awayVal);
                        }
                        if (name.includes('shots on target') || name === 'shots on goal') {
                            normalizedStats.shotsOnGoal.home = parseVal(homeVal);
                            normalizedStats.shotsOnGoal.away = parseVal(awayVal);
                        }

                        if (name === 'dangerous attacks') {
                            normalizedStats.dangerousAttacks.home = parseVal(homeVal);
                            normalizedStats.dangerousAttacks.away = parseVal(awayVal);
                        } else if ((name === 'final third entries' || name === 'big chances') && normalizedStats.dangerousAttacks.home === 0) {
                            normalizedStats.dangerousAttacks.home = parseVal(homeVal);
                            normalizedStats.dangerousAttacks.away = parseVal(awayVal);
                        }

                        if (name.includes('expected goals') || name === 'xg') {
                            normalizedStats.xg.home = parseVal(homeVal);
                            normalizedStats.xg.away = parseVal(awayVal);
                        }

                        if (name === 'corner kicks' || name === 'corners') {
                            normalizedStats.corners.home = parseVal(homeVal);
                            normalizedStats.corners.away = parseVal(awayVal);
                        }

                        if (name === 'yellow cards') {
                            normalizedStats.cards.home.yellow = parseVal(homeVal);
                            normalizedStats.cards.away.yellow = parseVal(awayVal);
                        }
                        if (name === 'red cards') {
                            normalizedStats.cards.home.red = parseVal(homeVal);
                            normalizedStats.cards.away.red = parseVal(awayVal);
                        }

                        normalizedStats.rawStats[item.name] = { home: homeVal, away: awayVal };
                    });
                });
                normalizedStats.groups = allStats.groups;

                // If major stats are missing AFTER checking all groups, it might be a limited coverage match
                const hasMajorStats = normalizedStats.shotsOnGoal.home > 0 || normalizedStats.shotsOnGoal.away > 0 ||
                    normalizedStats.dangerousAttacks.home > 0 || normalizedStats.dangerousAttacks.away > 0;

                if (!hasMajorStats) {
                    // Check if other groups exist to decide if it's partial or just limited
                    const totalItems = allStats.groups.reduce((acc, g) => acc + g.statisticsItems.length, 0);
                    if (totalItems < 5) isPartial = true;
                }
            } else {
                isPartial = true;
            }
        } else {
            isPartial = true;
        }

        return {
            id: event.id,
            homeTeam: event.homeTeam.name,
            awayTeam: event.awayTeam.name,
            leagueName: event.tournament?.name || 'Unknown League',
            score: { home: event.homeScore.current, away: event.awayScore.current },
            minute: this.calculateMinute(event),
            stats: normalizedStats,
            isPartial: isPartial,
            latency: 0,
            dataQuality: isPartial ? 'PARTIAL' : (normalizedStats.shotsOnGoal.home === 0 && normalizedStats.shotsOnGoal.away === 0 ? 'LIMITED' : 'OK'),
            source: 'SOFASCORE'
        };
    },

    /**
     * Calculates the current live minute from SofaScore statusTime.
     */
    calculateMinute(event) {
        if (!event || !event.status) return '0\'';

        const statusType = event.status.type;
        const description = event.status.description || 'Live';

        if (statusType !== 'inprogress') return description;

        // If it's halftime, return the description
        if (description.toLowerCase().includes('half') && description.toLowerCase().includes('time')) {
            return description;
        }

        const statusTime = event.statusTime || event.time;
        if (statusTime && statusTime.timestamp) {
            const now = Math.floor(Date.now() / 1000);
            const start = statusTime.timestamp;
            const initial = statusTime.initial || 0;
            const elapsed = Math.floor((now - start) / 60);
            const calcMinute = Math.floor(initial / 60) + elapsed;

            // Limit to reasonable values (e.g. max 90 + injury)
            if (elapsed >= 0 && elapsed < 60) {
                return calcMinute.toString();
            }
        }

        return description;
    }
};
