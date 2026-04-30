@echo off
title Boite a Idees - ENSMG
echo.
echo  ===========================================
echo   Boite a Idees ENSMG - Demarrage
echo  ===========================================
echo.

echo  [1/2] Demarrage du Backend (Django)...
start "Backend - Django" cmd /k "cd /d "%~dp0backend" && python manage.py runserver"

timeout /t 2 /nobreak >nul

echo  [2/2] Demarrage du Frontend (React + Vite)...
start "Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  Les deux serveurs demarrent dans des fenetres separees.
echo.
echo  Backend  : http://localhost:8000
echo  Frontend : http://localhost:5173
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
