@echo off
REM Live Bet Mentor - Baslatici
cd /d "%~dp0"

echo ==========================================
echo    Live Bet Mentor Baslatiliyor...
echo ==========================================

REM 1. Gereksinim Kontrolu
echo [1/4] Node ve Python kontrol ediliyor...
node -v
python --version

REM 2. Cache Temizleme
echo [2/4] Eski cache temizleniyor...
if exist "dist" (
    echo [BILGI] dist klasoru siliniyor...
    rmdir /s /q "dist"
)
if exist "node_modules\.vite" (
    echo [BILGI] Vite cache temizleniyor...
    rmdir /s /q "node_modules\.vite"
)

REM 3. Modul Kontrolu
echo [3/4] Bagimliliklar kontrol ediliyor...
if not exist node_modules (
    echo [BILGI] Moduller yukleniyor, lutfen bekleyin...
    call npm install
)

REM 4. Sunucuyu Baslat
echo [4/4] Uygulama baslatiliyor...
echo Bu pencereyi kapatmayin.
echo Tarayici 10 saniye icinde otomatik acilacak.

REM Yeni pencerede sunuculari baslat
start "LBM-Sunucu" cmd /k "npm run start"

REM Tarayiciyi acmak icin bekle
timeout /t 10

REM Tarayiciyi cache bypass ile ac (Ctrl+Shift+R efekti)
start "" "http://localhost:5173/?v=%random%"

echo.
echo Islem tamam! 
echo [IPUCU] Hala eski goruyorsan tarayicida Ctrl+Shift+R yap.
pause
