import axios from 'axios';
import { config } from '../../config.js';

/**
 * Live-Score-API Service
 * Documentation: https://live-score-api.com/documentation
 */
class LiveScoreService {
    constructor() {
        this.apiKey = process.env.LIVESCORE_API_KEY;
        this.apiSecret = process.env.LIVESCORE_API_SECRET;
        // Vite proxy yolunu kullan: /api-livescore -> https://live-score-api.com
        this.baseUrl = '/api-livescore/api-client/';
    }

    /**
     * Canlı maçları ve temel skorları çeker.
     */
    async getLiveScores() {
        try {
            const response = await axios.get(`${this.baseUrl}scores/live.json`, {
                params: {
                    key: this.apiKey,
                    secret: this.apiSecret
                }
            });

            if (response.data && response.data.success) {
                return response.data.data.match;
            }
            throw new Error('Live-Score-API Error: ' + JSON.stringify(response.data.error));
        } catch (error) {
            console.error('Error fetching live scores:', error.message);
            return [];
        }
    }

    /**
     * Belirli bir maçın detaylı istatistiklerini (Tehlikeli Atak, Korner, Şut vb.) çeker.
     * @param {number} matchId Live-Score-API match_id
     */
    async getMatchStatistics(matchId) {
        try {
            const response = await axios.get(`${this.baseUrl}matches/stats.json`, {
                params: {
                    key: this.apiKey,
                    secret: this.apiSecret,
                    match_id: matchId
                }
            });

            if (response.data && response.data.success) {
                return this._normalizeStats(response.data.data.stats);
            }
            return null;
        } catch (error) {
            console.error(`Error fetching stats for match ${matchId}:`, error.message);
            return null;
        }
    }

    /**
     * API verisini projedeki iç formata çevirir.
     * Örnek: "33:56" formatındaki tehlikeli atakları ayırır.
     */
    _normalizeStats(rawStats) {
        const normalized = {};

        // Tehlikeli Atak (Dangerous Attacks)
        if (rawStats.dangerous_attacks) {
            const [home, away] = rawStats.dangerous_attacks.split(':').map(Number);
            normalized.dangerousAttacks = { home, away };
        }

        // Şutlar (Shots on Target)
        if (rawStats.shots_on_target) {
            const [home, away] = rawStats.shots_on_target.split(':').map(Number);
            normalized.shotsOnTarget = { home, away };
        }

        // Kornerler (Corners)
        if (rawStats.corners) {
            const [home, away] = rawStats.corners.split(':').map(Number);
            normalized.corners = { home, away };
        }

        // Topla Oynama (Possession)
        if (rawStats.possession) {
            const [home, away] = rawStats.possession.replace(/%/g, '').split(':').map(Number);
            normalized.possession = { home, away };
        }

        return normalized;
    }
}

export const liveScoreService = new LiveScoreService();
