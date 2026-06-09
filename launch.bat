@echo off
REM ---------------------------------------------------------------
REM decoded-demo launcher.
REM
REM   1. cd into the demo's eir/ dev project
REM   2. git pull origin main (so cloned copies stay current)
REM   3. npm install --silent (idempotent; resolves any new deps)
REM   4. start the Vite dev server in a new window
REM   5. open http://localhost:5174 in the default browser
REM
REM Demo lives in a SEPARATE repo from the production IVG tool and
REM runs on port 5174 (production is on 5173) so both can run side
REM by side without colliding.
REM ---------------------------------------------------------------

cd /d "%~dp0"

echo.
echo [decoded-demo] pulling latest from main...
git pull origin main

cd eir

echo.
echo [decoded-demo] installing dependencies (silent)...
call npm install --silent

echo.
echo [decoded-demo] starting Vite on http://localhost:5174 ...
start "decoded-demo dev" cmd /k "npm run dev"

REM Give Vite a moment to bind the port before opening the browser
timeout /t 5 /nobreak >nul
start "" "http://localhost:5174/"

echo.
echo [decoded-demo] launcher done. Vite is running in the other window.
pause
