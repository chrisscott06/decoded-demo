@echo off
REM ---------------------------------------------------------------
REM decoded-demo launcher — click once, get a running demo.
REM
REM Whatever's on port 5174 right now gets killed. Vite starts
REM clean in a new window. Browser opens. No pause, no "press a key
REM to continue", no port-collision dance.
REM ---------------------------------------------------------------

cd /d "%~dp0"

echo.
echo [decoded-demo] pulling latest from main...
git pull origin main >nul 2>&1

REM Force-kill anything currently LISTENING on 5174. Loops over every
REM matching netstat row (there can be multiple — TCP4 + TCP6) and
REM extracts the PID from column 5, then taskkill /F /PID. Errors
REM redirected to nul because "no matching task" is fine when the
REM port is already free.
echo [decoded-demo] clearing port 5174 if anything's holding it...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5174 .*LISTENING"') do (
    echo                killing PID %%a
    taskkill /F /PID %%a >nul 2>&1
)

cd eir

REM Only run npm install if node_modules is missing or empty. Saves
REM ~5-10 seconds per re-launch once the demo is set up.
if not exist node_modules\.package-lock.json (
    echo [decoded-demo] installing dependencies (first run, silent)...
    call npm install --silent
)

echo [decoded-demo] starting Vite on http://localhost:5174 ...
start "decoded-demo dev" cmd /k "npm run dev"

REM Give Vite ~3s to bind the port before opening the browser.
timeout /t 3 /nobreak >nul
start "" "http://localhost:5174/"

REM No pause — this launcher window auto-closes. Vite stays running in
REM its own window; close that window to stop the demo.
