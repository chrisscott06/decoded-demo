@echo off
setlocal
title decoded-demo launcher

REM ---------------------------------------------------------------
REM decoded-demo launcher.
REM
REM Goto-based control flow (no multi-line `if (...)` blocks) so cmd
REM doesn't trip on parens inside echo strings. Verbose by design so
REM silent failures stay visible.
REM ---------------------------------------------------------------

set "PORT=8174"
set "DEMO_ROOT=%~dp0"

echo ============================================
echo [decoded-demo] launcher starting
echo ============================================
echo Working dir: %DEMO_ROOT%
echo Target port: %PORT%
echo.

cd /d "%DEMO_ROOT%"
if errorlevel 1 goto :err_cd_root

echo [1/5] Pulling latest from main...
git pull origin main
echo.

echo [2/5] Clearing port %PORT% if anything's holding it...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    echo        killing PID %%a and its child tree
    taskkill /F /T /PID %%a >nul 2>&1
)
echo.

echo [3/5] Switching to eir/ ...
cd eir
if errorlevel 1 goto :err_no_eir
echo.

echo [4/5] Checking dependencies...
if exist node_modules\.package-lock.json goto :deps_ok
echo        node_modules missing - running npm install. This can take a few minutes.
call npm install --silent
if errorlevel 1 goto :err_install
goto :deps_done
:deps_ok
echo        node_modules present, skipping install.
:deps_done
echo.

echo [5/5] Starting Vite on http://localhost:%PORT% ...
echo        in a new window titled "decoded-demo dev"
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
echo   Press any key to close THIS launcher window.
echo   Vite keeps running.
echo ============================================
pause >nul
endlocal
exit /b 0

:err_cd_root
echo ERROR: could not cd to %DEMO_ROOT%
goto :pause_and_exit

:err_no_eir
echo ERROR: could not cd to eir/ - is the folder missing?
goto :pause_and_exit

:err_install
echo ERROR: npm install failed. See output above.
goto :pause_and_exit

:pause_and_exit
echo.
echo Press any key to close this window.
pause >nul
endlocal
exit /b 1
