@echo off
cd /d "%~dp0"

set "PY_EXE=python"
set "PYW_EXE=pythonw"
if exist ".venv\Scripts\python.exe" (
    set "PY_EXE=.venv\Scripts\python.exe"
    set "PYW_EXE=.venv\Scripts\pythonw.exe"
)

"%PY_EXE%" --version >nul 2>nul
if errorlevel 1 goto :no_python

"%PY_EXE%" -c "import httpx, PIL, sentencepiece" >nul 2>nul
if errorlevel 1 (
    echo [Init] Installing missing Python packages from requirements.txt ...
    "%PY_EXE%" -m pip install -r requirements.txt
    if errorlevel 1 goto :pip_failed
)

"%PY_EXE%" -c "import story_engine, nai_api, story_gui"
if errorlevel 1 goto :import_failed

if defined NAI_DRY_RUN exit /b 0

if exist "%PYW_EXE%" (
    start "" "%PYW_EXE%" story_gui.py
    exit /b 0
)
where pythonw >nul 2>nul
if not errorlevel 1 (
    start "" pythonw story_gui.py
    exit /b 0
)
start "" "%PY_EXE%" story_gui.py
exit /b 0

:no_python
echo [Error] Python not found in PATH.
pause
exit /b 1

:pip_failed
echo [Error] Failed to install dependencies from requirements.txt.
pause
exit /b 1

:import_failed
echo [Error] Startup check failed. See traceback above.
pause
exit /b 1
