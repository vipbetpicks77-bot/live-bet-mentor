---
description: Full system health check - verifies all scrapers, data flows, and services
---

# Sistem Sağlık Kontrolü (Health Check)

Bu workflow, tüm sistemin düzgün çalışıp çalışmadığını kontrol eder.

// turbo-all

## 1. Sunucu Durumu Kontrolü
```powershell
netstat -ano | findstr ":5173 :3001"
```
- Port 5173 (Vite) ve 3001 (Proxy) açık olmalı

## 2. Veri Dosyaları Kontrolü
```powershell
powershell -Command "Get-ChildItem server\*.json | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize"
```
Kontrol edilecekler:
- `sofascore_live.json` - Son 1 dakika içinde güncellenmiş olmalı
- `consensus_data.json` - 4 saatten eski olmamalı
- `live_odds.json` - Son 2 dakika içinde güncellenmiş olmalı

## 3. Canlı Maç Sayısı
```powershell
powershell -Command "(Get-Content server\sofascore_live.json | ConvertFrom-Json).events.Count"
```
- 0'dan büyük olmalı

## 4. Scraper Log Kontrolü
```powershell
powershell -Command "Get-Content server\scraper.log -Tail 30"
```
Aranacaklar:
- ✅ `Captured LIVE_LIST` - Her 15 saniyede görünmeli
- ✅ `[AUTO-STATS] Processing batch` - Her 30 saniyede görünmeli
- ✅ `Captured STATS for` - Düzenli olarak görünmeli
- ❌ `ERROR` veya `FATAL` - Olmamalı

## 5. İstatistik Dosyaları Kontrolü
```powershell
dir server\stats | Sort-Object LastWriteTime -Descending | Select-Object -First 10
```
- Son 2 dakika içinde güncellenen `_stats.json` dosyaları olmalı

## 6. Consensus Kaynak Kontrolü
```powershell
powershell -Command "(Get-Content server\consensus_data.json | ConvertFrom-Json) | Group-Object source | Select-Object Name, Count"
```
Beklenen kaynaklar: forebet, vitibet, prosoccer, zulubet, superbet, soccervista

## 7. API Endpoint Testi
```powershell
curl -s http://localhost:3001/api/sofascore/live | powershell -Command "$input | ConvertFrom-Json | Select-Object -ExpandProperty events | Measure-Object | Select-Object -ExpandProperty Count"
```
- 0'dan büyük olmalı

## 8. Frontend Erişim Kontrolü
Tarayıcıda http://localhost:5173 açık olmalı ve:
- CANLI FIRSATLAR bölümü maç göstermeli
- RADAR TAHMİNLERİ bölümü kaynak göstermeli
- Maça tıklandığında İSTATİSTİKLER yüklenmeli

---

## Sorun Tespit Edilirse

### Scraper çalışmıyorsa:
```powershell
taskkill /F /IM python.exe; taskkill /F /IM node.exe
npm run dev
node server/proxy.js
```

### Stats dosyaları güncel değilse:
- AUTO-STATS özelliğinin aktif olduğunu kontrol et
- `scraper.log`'da `[AUTO-STATS]` mesajları var mı bak

### Consensus verisi boşsa:
```powershell
python server/consensus_scraper.py
```
