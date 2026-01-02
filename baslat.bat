@echo off
TITLE Live Bet Mentor - Baslatici
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    Live Bet Mentor Baslatiliyor...
echo ==========================================

:: 1. Node.js Kontrolu
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [HATA] Node.js yuklu degil! Lutfen https://nodejs.org/ adresinden kurun.
    pause
    exit /b
)

:: 2. Python Kontrolu
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [HATA] Python yuklu degil! Lutfen https://www.python.org/ adresinden kurun.
    pause
    exit /b
)

:: 3. Node Bagimliliklari Kontrolu
if not exist "node_modules\" (
    echo [BILGI] Node modulleri eksik, yukleniyor...
    call npm install
)

:: 4. Python Bagimliliklari Kontrolu
echo [BILGI] Python kütüphaneleri kontrol ediliyor...
python -c "import undetected_chromedriver; import selenium" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [BILGI] Gerekli Python kütüphaneleri yukleniyor...
    pip install undetected-chromedriver selenium
)

:: 5. Sunuculari Baslat
echo [BILGI] Sunucular baslatiliyor... (Yeni pencerede acilacak)
start "Live Bet Mentor - Proxy & Scraper" cmd /k "npm run start"

:: 6. Tarayiciyi Ac (Biraz bekle)
echo [BILGI] Uygulama hazirlaniyor, tarayici 5 saniye icinde acilacak...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo ==========================================
echo    Uygulama Calisiyor! 
echo    Bu pencereyi kapatabilirsin.
echo ==========================================
timeout /t 3 >nul
exit
