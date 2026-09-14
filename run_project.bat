@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   PDF Studio - Fast Automated Launch Script
echo ===================================================

:: 1. Port Cleanup (FastAPI: 8000, Vite: 5173)
echo [+] Cleaning up existing ports (8000 and 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a 2>nul

:: 2. Backend Setup & Startup
echo [+] Checking Backend...
cd /d "%~dp0backend"

if not exist "venv" (
    echo [INFO] First-time setup: Creating venv and installing packages...
    python -m venv venv
    call venv\Scripts\activate
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

echo [INFO] Launching FastAPI Backend on http://localhost:8000 ...
start "PDF Studio Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: 3. Frontend Setup & Startup
echo [+] Checking Frontend...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [INFO] First-time setup: Installing npm modules...
    call npm install
) else (
    call npm install
)

echo [INFO] Launching Vite Frontend on http://localhost:5173 ...
start "PDF Studio Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: 4. Launch Browser
echo [+] Waiting 3 seconds for servers to start...
timeout /t 3 /nobreak >nul

echo [+] Launching browser...
start http://localhost:5173

echo ===================================================
echo   PDF Studio is running!
echo ===================================================
endlocal
