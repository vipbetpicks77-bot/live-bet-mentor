/**
 * MACKOLIK LIVE SCRAPER PROTOTYPE
 * Focus: Live scores and match data for validation.
 * 
 * NOTE: Direct scraping from client-side may require a proxy in production.
 * This prototype implements the normalization and 4D matching prep.
 */

export const mackolikScraper = {
    MACKOLIK_LIVE_ENDPOINT: '/api-mackolik/v1/list',
    simulateConflict: false, // For Negative Testing (Phase 11)
    simulateFailure: false, // For Failover Testing (Scenario 2)

    /**
     * Fetches live matches from Maçkolik.
     * In a browser environment, this simulation demonstrates the data flow.
     */
    fetchLiveMatches: async () => {
        try {
            console.log('[MACKOLIK] Fetching live data via HTML parsing...');

            if (mackolikScraper.simulateFailure) {
                console.warn('[MACKOLIK] Simulated failure - returning empty dataset');
                return [];
            }

            // JSON endpoint'i bot korumasına (502/403) takıldığı için ana sayfadan SSR verisini çek
            const response = await fetch('/api-mackolik-data/canli-sonuclar');
            if (!response.ok) throw new Error(`Mackolik HTML status: ${response.status}`);

            const html = await response.text();

            // Maçkolik verisi genellikle window.renderData içinde JSON olarak bulunur
            const pattern = /window\.renderData\s*=\s*({.*?});/s;
            const match = html.match(pattern);

            if (match && match[1]) {
                try {
                    const parsed = JSON.parse(match[1]);
                    // liveMatches listesini bul (farklı property isimleri olabiliyor)
                    const liveData = parsed.liveMatches ||
                        (parsed.props && parsed.props.pageProps && parsed.props.pageProps.liveMatches);

                    if (liveData) return mackolikScraper.normalize(liveData);
                } catch (parseErr) {
                    console.error('[MACKOLIK] JSON parse error in HTML:', parseErr);
                }
            }

            console.warn('[MACKOLIK] Could not find liveMatches in HTML');
            return [];
        } catch (error) {
            console.error('Maçkolik Scraper Error:', error);
            return [];
        }
    },

    /**
     * Normalizes Maçkolik data to matches our 4D Matching schema.
     */
    normalize: (rawList) => {
        if (!Array.isArray(rawList)) return [];

        return rawList.map(item => {
            // Maçkolik JSON yapısı: 
            // i: id, h: home, a: away, hsc: homeScore, asc: awayScore, m: minute, l: league, st: startTime
            return {
                id: item.i || item.id,
                homeTeam: item.h || 'Unknown',
                awayTeam: item.a || 'Unknown',
                score: {
                    home: parseInt(item.hsc) || 0,
                    away: parseInt(item.asc) || 0
                },
                minute: item.m ? `${item.m}'` : '0\'',
                leagueName: item.ln || item.l || 'Unknown League',
                kickoff: item.st || '',
                source: 'Mackolik',
                original: item
            };
        });
    }
};
