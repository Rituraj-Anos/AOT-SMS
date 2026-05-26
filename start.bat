@echo off
title AOT-SMS Startup
echo ============================================
echo   AOT Student Management System - Startup
echo ============================================
echo.

echo [1/3] Copying WAR to Tomcat...
copy /Y "C:\coding\AOT-SMS\target\AOT-SMS.war" "C:\tomcat\webapps\" >nul
echo       Done.
echo.

echo [2/3] Starting Tomcat (backend on port 8080)...
start "AOT-SMS Backend" cmd /k "set JAVA_HOME=C:\Program Files\Java\jdk-17&& set CATALINA_HOME=C:\tomcat&& C:\tomcat\bin\catalina.bat run"
echo       Waiting 15 seconds for Tomcat to boot...
timeout /t 15 /nobreak >nul
echo       Done.
echo.

echo [3/3] Starting React frontend (port 5173)...
start "AOT-SMS Frontend" cmd /k "cd /d C:\coding\AOT-SMS\frontend-app && npm run dev"
echo       Done.
echo.

echo ============================================
echo   Everything is starting!
echo.
echo   Backend:  http://localhost:8080/AOT-SMS/api/health
echo   Frontend: http://localhost:5173/login
echo.
echo   Login:    admin / Admin@AOT2026
echo ============================================
echo.
timeout /t 8 /nobreak >nul
start http://localhost:5173/login

echo.
echo You can close THIS window. Keep the other two open.
pause
