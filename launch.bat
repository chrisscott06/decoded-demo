@echo off
setlocal
title decoded-demo launcher

REM ---------------------------------------------------------------
REM decoded-demo launcher.
REM
REM Verbose by design — every step prints, the window stays open at
REM the end so any error is visible. Vite runs in a SEPARATE window
REM (the "decoded-demo dev" one) so closing this launcher doesn't
REM kill the demo.
REM ---------------------------------------------------------------

set "PORT=8174"
set "DEMO_ROOT=%~dp0"

echo ============================================
echo [decoded-demo] launcher starting
echo ============================================
echo Working dir: %DEMO_ROOT%
echo Target port: %PORT%
echo.

cd /d "%DEMO_ROOT%" || (
    echo ERROR: could not cd to %DEMO_ROOT%
    goto :pause_and_exit
)

echo [1/5] Pulling latest from main...
git pull origin main
if errorlevel 1 (
    echo        WARNING: git pull failed (continuing anyway)
)
echo.

echo [2/5] Clearing port %PORT% if anything's holding it...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    echo        killing PID %%a (and its child tree)
    taskkill /F /T /PID %%a >nul 2>&1
)
echo.

echo [3/5] Switching to eir/ ...
cd eir || (
    echo ERROR: could not cd to eir/ - is it missing?
    goto :pause_and_exit
)
echo.

echo [4/5] Checking dependencies...
if not exist node_modules\.package-lock.json (
    echo        node_modules missing - running npm install (this can take a few minutes)...
    call npm install --silent
    if errorlevel 1 (
        echo ERROR: npm install failed
        goto :pause_and_exit
    )
) else (
    echo        node_modules present, skipping install
)
echo.

echo [5/5] Starting Vite on http://localhost:%PORT% ...
echo        (in a new window titled "decoded-demo dev")
start "decoded-demo dev" cmd /k "echo Starting Vite on port %PORT% ... && npm run dev"
echo.

echo Waiting 4 seconds for Vite to bind the port...
timeout /t 4 /nobreak >nul
echo.

echo Opening browser at http://localhost:%PORT%/
start "" "http://localhost:%PORT%/"
echo.

echo ============================================
echo [decoded-demo] launcher done.
echo.
echo   Vite is running in the OTHER window titled
echo   "decoded-demo dev". Close that window to
echo   stop the demo.
echo.
echo   Press any key to close THIS launcher window
echo   (vite keeps running).
echo ============================================

:pause_and_exit
echo.
pause >nul
endlocal
