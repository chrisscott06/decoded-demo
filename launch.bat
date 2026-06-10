@echo off
REM ---------------------------------------------------------------
REM decoded-demo launcher (port-aware).
REM
REM   1. cd into the demo
REM   2. git pull origin main
REM   3. If something is already LISTENING on 5174:
REM        - skip npm install + skip starting vite
REM        - just open the browser at the existing URL
REM      Otherwise:
REM        - cd eir, npm install --silent, start vite in a new window,
REM          wait 5s, open the browser
REM
REM Demo lives in a SEPARATE repo from the source production tool
REM and runs on port 5174 (production is on 5173) so both can run
REM side by side without colliding. strictPort is set in
REM vite.config.js, so a second `npm run dev` would crash hard
REM rather than silently roam to 5175 - hence the port check here.
REM ---------------------------------------------------------------

cd /d "%~dp0"

echo.
echo [decoded-demo] pulling latest from main...
git pull origin main

REM Port check: if anything is LISTENING on 5174, the demo is already
REM running from a previous launch. Just open the browser at the
REM existing URL instead of trying to start a second vite (which would
REM fail under strictPort: true).
netstat -ano | findstr /R /C:":5174.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [decoded-demo] vite is already running on http://localhost:5174
    echo                 - opening the browser at the existing URL.
    echo                 To do a clean restart, close the existing vite
    echo                 window first.
    start "" "http://localhost:5174/"
    goto :end
)

cd eir

echo.
echo [decoded-demo] installing dependencies (silent)...
call npm install --silent

echo.
echo [decoded-demo] starting Vite on http://localhost:5174 ...
start "decoded-demo dev" cmd /k "npm run dev"

REM Give Vite a moment to bind the port before opening the browser.
timeout /t 5 /nobreak >nul
start "" "http://localhost:5174/"

echo.
echo [decoded-demo] launcher done. Vite is running in the other window.

:end
echo.
pause
