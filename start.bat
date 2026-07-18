@echo off
echo =====================================
IdentityVault - Starting Application
echo =====================================
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "venv\Scripts\activate && py main.py"
echo Backend: http://localhost:8000
echo.

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"
echo Frontend: http://localhost:3000
echo.

echo =====================================
IdentityVault is starting...
=====================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop both servers...
pause >nul

echo.
echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /T /F >nul 2>&1
echo Servers stopped
pause
