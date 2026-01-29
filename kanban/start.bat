@echo off
echo ========================================
echo   Project Kanban Board - Startup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not available
    pause
    exit /b 1
)

REM Install dependencies
echo [INFO] Installing dependencies...
pip install -r requirements.txt -q

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [INFO] Starting server...
echo [INFO] Open http://localhost:5000 in your browser
echo [INFO] Press Ctrl+C to stop the server
echo.

REM Start the Flask server
python app.py

pause
