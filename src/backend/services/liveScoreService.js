import axios from 'axios';

/**
 * APIFootball.com Service (Alternative to Live-Score-API)
 * Documentation: https://apifootball.com/documentation/
 */
class LiveScoreService {
    constructor() {
        this.apiKey = import.meta.env.VITE_APIFOOTBALL_KEY || 'a790d8fed5077cd8afe4cbc667ecef3ee5791b3ec0db4c56c5818865e24cc7e';
        // Vite proxy yolunu kullan: /api-apifootball -> https://apiv3.apifootball.com/
        this.baseUrl = '/api-apifootball';
    }

    /**
     * Canlı maçları çeker.
     */
    async getLiveScores() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get(`${this.baseUrl}`, {
                params: {
                    action: 'get_events',
                    from: today,
                    to: today,
                    match_live: 1,
                    APIkey: this.apiKey
                }
            });

            // API error: 404 genelde "canlı maç yok" demektir
            if (response.data && !response.data.error) {
                return Array.isArray(response.data) ? response.data : [];
            }

            if (response.data?.error === "404") {
                console.log('[APIFootball] No live matches at the moment (404 info)');
                return []; // Return empty array instead of null to indicate valid but empty result
            }

            console.warn('APIFootball getLiveScores Warning:', response.data?.error || 'Empty response');
            return null;
        } catch (error) {
            console.error('Error fetching live scores from APIFootball:', error.message);
            return null;
        }
    }

    /**
     * Belirli bir maçın detaylı istatistiklerini çeker.
     * @param {string} matchId APIFootball match_id
     */
    async getMatchStatistics(matchId) {
        try {
            const response = await axios.get(`${this.baseUrl}`, {
                params: {
                    action: 'get_statistics',
                    match_id: matchId,
                    APIkey: this.apiKey
                }
            });

            if (response.data && response.data[matchId]) {
                return this._normalizeStats(response.data[matchId].statistics);
            }
            return null;
        } catch (error) {
            console.error(`Error fetching stats for match ${matchId}:`, error.message);
            return null;
        }
    }

    /**
     * API verisini projedeki iç formata çevirir.
     */
    _normalizeStats(statsArray) {
        if (!Array.isArray(statsArray)) return null;

        const normalized = {
            possession: { home: 0, away: 0 },
            shotsOnGoal: { home: 0, away: 0 },
            dangerousAttacks: { home: 0, away: 0 },
            corners: { home: 0, away: 0 }
        };

        const findStat = (type) => statsArray.find(s => s.type.toLowerCase() === type.toLowerCase());

        // Tehlikeli Atak
        const da = findStat('Dangerous Attacks');
        if (da) {
            normalized.dangerousAttacks = { home: parseInt(da.home) || 0, away: parseInt(da.away) || 0 };
        }

        // Şutlar
        const sog = findStat('Shots On Goal');
        if (sog) {
            normalized.shotsOnGoal = { home: parseInt(sog.home) || 0, away: parseInt(sog.away) || 0 };
        }

        // Kornerler
        const corn = findStat('Corners');
        if (corn) {
            normalized.corners = { home: parseInt(corn.home) || 0, away: parseInt(corn.away) || 0 };
        }

        // Topla Oynama
        const poss = findStat('Ball Possession');
        if (poss) {
            normalized.possession = {
                home: parseInt(poss.home.replace('%', '')) || 0,
                away: parseInt(poss.away.replace('%', '')) || 0
            };
        }

        return normalized;
    }
}

export const liveScoreService = new LiveScoreService();
