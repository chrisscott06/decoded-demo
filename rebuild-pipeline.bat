@echo off
REM Westbrook ESG Tool — rebuild the pipeline from current source-data
REM Use this when you've updated any spreadsheet in pipeline/source-data/

title Westbrook ESG Tool - Pipeline Rebuild
cd /d "%~dp0pipeline"

echo.
echo ============================================
echo  Westbrook ESG Tool - rebuilding pipeline...
echo ============================================
echo.
echo  Reading source-data/ and writing dist/eir/...
echo.

call .venv\Scripts\python.exe build.py

echo.
echo ============================================
echo  Pipeline rebuild complete.
echo ============================================
echo.
echo  Review the output above for any validation
echo  warnings (these are data findings, not bugs).
echo.
echo  If the tool is already running, hit Ctrl+R
echo  in the browser to load the fresh JSON.
echo.
pause
