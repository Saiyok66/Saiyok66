@echo off
echo ====================================================
echo   SQL Optimizer Dashboard - Setup Script
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install it from https://nodejs.org
    pause
    exit /b 1
)
echo       Node.js found: 
node --version

echo.
echo [2/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Starting the server...
echo.
echo ====================================================
echo   Open your browser and go to:
echo   http://localhost:3000
echo ====================================================
echo.
echo   Press Ctrl+C to stop the server.
echo.

node server.js
