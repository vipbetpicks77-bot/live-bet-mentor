/**
 * AI ANALYST SERVICE
 * Connects to Google Gemini API to provide expert summaries.
 */
import { CONFIG } from '../config';

const RADAR_SOURCES = [
    { id: 'forebet', label: 'Forebet' },
    { id: 'prosoccer', label: 'ProSoccer' },
    { id: 'predictz', label: 'PredictZ' },
    { id: 'windrawwin', label: 'WDW' },
    { id: 'statarea', label: 'Statarea' },
    { id: 'vitibet', label: 'Vitibet' },
    { id: 'zulubet', label: 'Zulubet' },
    { id: 'olbg', label: 'OLBG' }
];

const RADAR_BASE_URLS = {
    forebet: 'https://www.forebet.com',
    predictz: 'https://www.predictz.com',
    windrawwin: 'https://www.windrawwin.com',
    statarea: 'https://www.statarea.com',
    vitibet: 'https://www.vitibet.com',
    zulubet: 'http://www.zulubet.com',
    prosoccer: 'https://www.prosoccer.gr',
    olbg: 'https://www.olbg.com'
};

export const aiAnalystService = {
    generateExpertPrompt(fixture, consensusReport) {
        const { homeTeam, awayTeam, minute, score, stats, observations } = fixture;

        // Advanced stats including xG
        const detailStats = `
          ŞUTLAR (İsabetli/Toplam): EV:${stats?.shotsOnGoal?.home || 0}/${stats?.totalShots?.home || 0} - DEP:${stats?.shotsOnGoal?.away || 0}/${stats?.totalShots?.away || 0}
          TEHLİKELİ ATAK: EV:${stats?.dangerousAttacks?.home || 0} - DEP:${stats?.dangerousAttacks?.away || 0}
          KORNER: EV:${stats?.corners?.home || 0} - DEP:${stats?.corners?.away || 0}
          KARTLAR (Sarı/Kırmızı): EV:${stats?.yellowCards?.home || 0}/${stats?.redCards?.home || 0} - DEP:${stats?.yellowCards?.away || 0}/${stats?.redCards?.away || 0}
          TOPLA OYNAMA: EV:${stats?.possession?.home || 0}% - DEP:${stats?.possession?.away || 0}%
        `;

        // xG and Big Chances - critical for quality analysis
        const xgHome = stats?.xg?.home || 0;
        const xgAway = stats?.xg?.away || 0;
        const bigChancesHome = stats?.bigChances?.home || 0;
        const bigChancesAway = stats?.bigChances?.away || 0;
        const scoreHome = score?.home || 0;
        const scoreAway = score?.away || 0;
        const xgDiff = (xgHome - xgAway) - (scoreHome - scoreAway);

        const advancedMetrics = `
          xG (BEKLENEN GOL): EV: ${typeof xgHome === 'number' ? xgHome.toFixed(2) : xgHome} - DEP: ${typeof xgAway === 'number' ? xgAway.toFixed(2) : xgAway}
          BÜYÜK ŞANSLAR (Net Pozisyon): EV: ${bigChancesHome} - DEP: ${bigChancesAway}
          xG vs SKOR FARKI: ${typeof xgDiff === 'number' ? xgDiff.toFixed(2) : 0} (+ = Ev şanssız, - = Deplasan şanssız)
        `;

        const signals = consensusReport?.signals || [];
        const consensusDetail = signals.length > 0
            ? signals.map(s => {
                const siteLabel = RADAR_SOURCES.find(rs => rs.id === s.site)?.label || s.site;
                return `${siteLabel}: ${s.prediction}`;
            }).join(', ')
            : 'Konsensus verisi yok';

        // Pre-match consensus summary
        const agreement = consensusReport?.agreement || {};
        const totalSources = signals.length;
        const topPrediction = Object.entries(agreement).sort((a, b) => b[1] - a[1])[0];
        const preMatchSummary = topPrediction
            ? `${topPrediction[1]}/${totalSources} kaynak "${topPrediction[0]}" tahmin etti`
            : 'Konsensus yok';

        return `
      Sen profesyonel bir "Kuant ve Canlı Bahis Analizcisisin". Görevin, maçın istatistiksel trendlerini (10dk ivme, baskı), detaylı saha verilerini, xG metriklerini ve dünya konsensusunu birleştirerek kullanıcının göremediği market fırsatlarını yakalamak.

      VERİLER:
      - Maç: ${homeTeam} vs ${awayTeam} | Dakika: ${minute}' | Skor: ${scoreHome}-${scoreAway}
      - DQS (Veri Kalitesi): ${fixture?.dqs ? fixture.dqs.toFixed(2) : 'N/A'}
      - Baskı Gücü (0-100): ${observations?.pressure?.total || 0}
      - 10dk İvme Durumu (Velocity): ${observations?.velocity?.trend || 'STABLE'}
      
      - DETAYLI İSTATİSTİKLER: ${detailStats}
      
      - GELİŞMİŞ METRİKLER (KRİTİK): ${advancedMetrics}
      
      - MAÇ ÖNCESİ BEKLENTİ: ${preMatchSummary}
      - CANLI KONSENSUS (${totalSources} Site): ${consensusDetail}

      GÖREVİN (KESİNLİKLE TÜRKÇE VE MATEMATİKSEL YAZ):
      1. Market Tahminleri (% Olasılık ile): Her tahmin için matematiksel bir olasılık ver. xG verisini kullanarak gol beklentisini hesapla. (Örn: "Sıradaki Gol (Ev): %75 - xG farkı destekliyor", "1.5 Üst: %90").
      2. xG Analizi: 
         - xG vs Gerçek Skor karşılaştır: Takım şanslı mı yoksa şanssız mı oynuyor?
         - Büyük Şans sayısı düşükse ama xG yüksekse: "Düşük kalite, yüksek hacim" uyarısı ver.
      3. Senaryo Zekası & Hidden Insights: 
         - Gözle görülmeyen (Hidden) riskleri ve fırsatları vurgula.
         - Maç öncesi beklenti (${preMatchSummary}) vs şu anki durum çelişiyor mu?
         - DK 85+ ise: Gol ihtimalini gerçekçi ve matematiksel değerlendir.
      4. Risk Analizi: Maçtaki tüm riskleri (kırmızı kart riski, ivme kaybı, xG tuzağı, divergence) tart.
      5. Profesyonel Özet: Maksimum 4 cümle. Direkt, keskin ve aksiyon odaklı ol.
    `;
    },

    async getExpertSummary(fixture, consensusReport) {
        console.log('[AI_SERVICE] getExpertSummary called with:', {
            fixture: fixture ? 'exists' : 'null',
            consensusReport: consensusReport ? 'exists' : 'null'
        });

        const modelName = 'gemini-2.0-flash';
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.length < 10) {
            console.warn('[AI_SERVICE] Missing or invalid API Key. Using local expert fallback.');
            return this.getLocalExpertLogic(fixture, consensusReport);
        }

        try {
            console.log('[AI_SERVICE] Generating prompt...');
            const prompt = this.generateExpertPrompt(fixture, consensusReport);
            console.log('[AI_SERVICE] Prompt generated, length:', prompt?.length);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for complex analysis

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            console.log('[AI_SERVICE] Calling Gemini API...');

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                }),
                signal: controller.signal
            });

            console.log('[AI_SERVICE] Response received, status:', response.status);
            clearTimeout(timeout);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('[AI_SERVICE] Gemini API Error:', response.status, errData);
                return this.getLocalExpertLogic(fixture, consensusReport);
            }

            const data = await response.json();
            console.log('[AI_SERVICE] Data received, has candidates:', !!data.candidates);
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            console.log('[AI_SERVICE] Result length:', result?.length || 0);
            return result || this.getLocalExpertLogic(fixture, consensusReport);
        } catch (error) {
            console.error('[AI_SERVICE] Deep Analysis failed:', error.name, error.message);
            return this.getLocalExpertLogic(fixture, consensusReport);
        }
    },

    getLocalExpertLogic(fixture, consensusReport) {
        const { observations, dqs, homeTeam, awayTeam, score, minute, stats } = fixture;
        const pressure = observations?.pressure?.total || 0;
        const trend = observations?.velocity?.trend || 'STABLE';
        const agreement = consensusReport?.agreement || {};
        const minNum = parseInt(minute) || 0;

        let insight = "";
        let nextGoalProb = 10; // Base 10%

        if (minNum >= 85) {
            nextGoalProb = pressure > 60 ? 25 : 5;
            if (minNum >= 90 && pressure < 50) nextGoalProb = 0;
        } else {
            if (pressure > 70) nextGoalProb += 50;
            else if (pressure > 40) nextGoalProb += 20;
            if (trend === 'HOT') nextGoalProb += 20;
            if (trend === 'COOLING') nextGoalProb -= 15;
        }

        const topPred = Object.entries(agreement).sort((a, b) => b[1] - a[1])[0];
        const favTrailing = topPred && (
            (topPred[0].includes('1') && score.home < score.away) ||
            (topPred[0].includes('2') && score.away < score.home)
        );

        if (favTrailing && pressure > 65) {
            nextGoalProb = Math.max(nextGoalProb, 65);
            insight += `🔄 FAVORİ BASKISI: ${topPred[0].includes('1') ? homeTeam : awayTeam} geride ama yükleniyor. `;
        }

        if (nextGoalProb >= 70) insight += `🔥 KRİTİK GOL BEKLENTİSİ (%${nextGoalProb}): Maçta gol kokusu var. `;
        else if (nextGoalProb >= 50) insight += `⚠️ GOL POTANSİYELİ (%${nextGoalProb}): Tempo yükseliyor. `;
        else insight += `💤 DÜŞÜK TEMPO (%${nextGoalProb}): Maçta kilitlenme hakim. `;

        if (dqs < 0.5) insight += " (Sınırlı Veri)";

        return insight + " (Yerel Kural Modu)";
    },

    async getGlobalIntelligenceReport(matches, type = 'LIVE') {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        // Enhanced match summaries with more data
        const matchSummaries = matches.map(m => {
            const consensus = m.consensusReport?.agreement ?
                Object.entries(m.consensusReport.agreement).map(([p, c]) => `${p}(${c})`).join(', ') : 'N/A';

            // For LIVE matches - include stats
            if (type === 'LIVE') {
                const xgHome = m.stats?.xg?.home || 0;
                const xgAway = m.stats?.xg?.away || 0;
                const pressure = m.observations?.pressure?.total || 0;
                const velocity = m.observations?.velocity?.trend || 'STABLE';
                const dqs = m.dqs?.toFixed(2) || 'N/A';
                const bigChances = `${m.stats?.bigChances?.home || 0}-${m.stats?.bigChances?.away || 0}`;

                return `- ${m.home || m.homeTeam} vs ${m.away || m.awayTeam}
  📊 Dk: ${m.minute || '?'}' | Skor: ${m.score?.home || 0}-${m.score?.away || 0}
  📈 xG: ${xgHome.toFixed ? xgHome.toFixed(2) : xgHome}-${xgAway.toFixed ? xgAway.toFixed(2) : xgAway} | Büyük Şans: ${bigChances}
  🔥 Baskı: %${pressure} | İvme: ${velocity} | DQS: ${dqs}
  🎯 Konsensus: ${consensus}`;
            }

            // For PRE-MATCH - include radar data
            const totalSources = m.totalSources || m.consensusReport?.totalSources || 0;
            const divergence = m.divergence || 0;
            const topPrediction = m.agreement ?
                Object.entries(m.agreement).sort((a, b) => b[1] - a[1])[0] : null;
            const predSummary = topPrediction ? `${topPrediction[0]} (%${Math.round(topPrediction[1] / totalSources * 100)})` : 'N/A';

            return `- ${m.home || m.homeTeam || m.match?.split(' vs ')[0]} vs ${m.away || m.awayTeam || m.match?.split(' vs ')[1]}
  📊 Kaynak: ${totalSources} | Divergence: %${divergence.toFixed ? divergence.toFixed(0) : divergence}
  🎯 Favori Tahmin: ${predSummary}
  📈 Konsensus: ${consensus}`;
        }).join('\n');

        const prompt = type === 'LIVE' ? `
Sen bir "PRO CANLI BAHİS STRATEJİSTİ"sin. Görevin, CANLI maçların gerçek zamanlı istatistiklerini (xG, baskı, ivme) ve global konsensüs verilerini birleştirerek en iyi fırsatları belirlemek.

CANLI MAÇ VERİLERİ:
${matchSummaries}

ANALİZ GÖREVLERİN (TÜRKÇE, AKSİYON ODAKLI):
1. **ALTIN SEÇİMLER**: xG, baskı ve konsensüs uyumuna göre en iyi 2-3 maçı seç. Her biri için:
   - Neden bu maç? (xG farkı, baskı üstünlüğü, konsensüs uyumu)
   - Hangi market? (Sıradaki Gol, Toplam Gol, Maç Sonucu)
   - Olasılık tahmini (%)
   - Risk seviyesi (DÜŞÜK/ORTA/YÜKSEK)

2. **KAÇINILMASI GEREKENLER**: xG tuzağı, ölü maç veya divergence riski olan maçlar.

3. **STRATEJİK KOMBİNASYON**: Güvenli bir ikili veya üçlü kombinasyon önerisi.

JSON FORMATI:
{
  "report_summary": "Genel canlı piyasa durumu (max 2 cümle)",
  "golden_picks": [
    {
      "match": "Takım A vs Takım B",
      "probability": 75,
      "verdict": "BET",
      "market": "Sıradaki Gol (Ev)",
      "reason": "xG farkı +0.8, baskı %70, 4/5 konsensüs",
      "risk": "ORTA"
    }
  ],
  "avoid_list": ["Maç X - ölü maç", "Maç Y - xG tuzağı"],
  "strategic_combo": {
    "type": "İKİLİ GÜVENLİ",
    "matches": ["Maç A: Over 1.5", "Maç B: 1"],
    "combined_probability": 65
  }
}
` : `
Sen bir "PRO MAÇ ÖNCESİ KONSENSÜS HAKEMİ"sin. Görevin, birden fazla tahmin kaynağından gelen verileri analiz ederek değer fırsatlarını bulmak.

GÜNLÜK MAÇ RADAR VERİLERİ:
${matchSummaries}

ANALİZ GÖREVLERİN (TÜRKÇE):
1. **ALTIN SEÇİMLER**: En yüksek kaynak uyumuna sahip maçları belirle.
2. **DEĞER MAÇLARI**: Divergence yüksek ama potansiyel değer sunan maçlar.
3. **HAKEMLİK**: Kaynaklar arasında çelişki varsa hangisi haklı?
4. **STRATEJİK KOMBİNASYON**: Güvenli kombinasyon önerisi.

JSON FORMATI:
{
  "report_summary": "Genel piyasa durumu (max 2 cümle)",
  "golden_picks": [
    {
      "match": "Takım A vs Takım B",
      "probability": 75,
      "verdict": "BET",
      "market": "Maç Sonucu 1",
      "reason": "6/7 kaynak hemfikir, matematiksel üstünlük",
      "risk": "DÜŞÜK"
    }
  ],
  "value_picks": [
    {
      "match": "Takım C vs Takım D",
      "market": "Over 2.5",
      "reason": "Yüksek divergence ama form verisi destekliyor"
    }
  ],
  "strategic_combo": {
    "type": "ÜÇLÜ SİSTEM",
    "matches": ["Maç A: 1", "Maç B: Over 2.5", "Maç C: BTTS"],
    "combined_probability": 55
  }
}
`;

        try {
            const modelName = "gemini-2.0-flash";
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

            if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.length < 10) {
                return "Global rapor için API anahtarı eksik.";
            }

            console.log('[AI_GLOBAL] Generating report for', type, 'with', matches.length, 'matches');

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('[AI_GLOBAL] API Error:', response.status, errData);
                return "Global rapor şu an oluşturulamıyor (API hatası).";
            }

            const data = await response.json();
            console.log('[AI_GLOBAL] Report generated successfully');
            return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Rapor boş döndü.";
        } catch (error) {
            console.error('[AI_GLOBAL] Error:', error.name === 'AbortError' ? 'Timeout' : error);
            return "Hata: Rapor oluşturma sırasında teknik bir problem (veya zaman aşımı) oluştu.";
        }
    }
};
