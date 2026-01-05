@echo off
TITLE Live Bet Mentor - Environment Test
echo ==========================================
echo    Environment Verification Script
echo ==========================================

echo [Node.js]
where node
node -v

echo.
echo [Python]
where python
python --version

echo.
echo [NPM]
where npm
call npm -v

echo.
echo [Directory]
cd
dir package.json

echo.
echo [Port Check]
netstat -ano | findstr :3001
netstat -ano | findstr :5173

echo.
echo ==========================================
echo    Testing Startup Command (Dry Run)
echo ==========================================
echo Running: node --version
node --version
if %ERRORLEVEL% neq 0 (
    echo [HATA] Node is not working correctly in this window!
) else (
    echo [OK] Node is working.
)

echo.
pause
