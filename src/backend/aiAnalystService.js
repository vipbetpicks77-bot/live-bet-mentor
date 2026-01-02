/**
 * AI ANALYST SERVICE
 * Connects to Google Gemini API to provide expert summaries.
 */
import { CONFIG } from '../config';

export const aiAnalystService = {
    async getExpertSummary(fixture, consensusReport) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
            return "AI Analizi için geçerli bir API anahtarı gerekiyor.";
        }

        const { homeTeam, awayTeam, minute, score, stats, observations } = fixture;

        // Prepare Prompt
        const prompt = `
      Sen profesyonel bir canlı bahis analizcisisin. Aşağıdaki canlı maç verilerini ve 6 farklı tahmin sitesinden gelen konsensus raporunu değerlendirerek 2-3 cümlelik, keskin bir "Uzman Özeti" yaz. 
      Odak noktan: "Oyunun ritmi (ivme)", "Baskı yoğunluğu" ve "Dünya ne diyor" arasındaki tutarlık olsun.
      
      MAÇ: ${homeTeam} vs ${awayTeam}
      DK: ${minute}' | SKOR: ${score.home}-${score.away}
      BASKI GÜCÜ (0-100): ${observations?.pressure?.total || 0}
      İVME DURUMU: ${observations?.velocity?.trend || 'STABLE'}
      KONSENSUS RAPORU: ${JSON.stringify(consensusReport.agreement)}
      
      NOT: Cevabı her zaman TÜRKÇE ver. "Gelebilir", "Riskli", "Vites arttı" gibi net ifadeler kullan.
    `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text.trim();
            }
            return "AI şu an yorum yapamıyor (Veri yetersiz).";
        } catch (error) {
            console.error('[AI_ANALYST] Error:', error);
            return "AI Servis Hatası (Bağlantı sorunu).";
        }
    }
};
