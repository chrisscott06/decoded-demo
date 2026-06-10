@echo off
REM ---------------------------------------------------------------
REM decoded-demo launcher — click once, get a running demo.
REM
REM Whatever's on port 8174 right now gets nuked (process tree, hard
REM kill). Vite starts fresh. Browser opens. No pause, no prompts.
REM ---------------------------------------------------------------

set PORT=8174

cd /d "%~dp0"

echo.
echo [decoded-demo] pulling latest from main...
git pull origin main >nul 2>&1

REM Force-kill anything currently LISTENING on PORT, with /T so we
REM also nuke any child processes (npm.exe → node.exe chains where
REM killing the parent leaves the grandchild bound to the port).
echo [decoded-demo] clearing port %PORT% if anything's holding it...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    echo                killing PID %%a and its children
    taskkill /F /T /PID %%a >nul 2>&1
)

cd eir

REM npm install only if node_modules is missing or incomplete.
if not exist node_modules\.package-lock.json (
    echo [decoded-demo] installing dependencies (first run, silent)...
    call npm install --silent
)

echo [decoded-demo] starting Vite on http://localhost:%PORT% ...
start "decoded-demo dev" cmd /k "npm run dev"

REM Give Vite ~3s to bind the port before opening the browser.
timeout /t 3 /nobreak >nul
start "" "http://localhost:%PORT%/"

REM Launcher window auto-closes. Vite stays running in its own window;
REM close that window to stop the demo. Re-run this launcher whenever -
REM it always kills + restarts cleanly.
