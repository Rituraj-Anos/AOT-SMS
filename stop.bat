@echo off
title AOT-SMS Shutdown
echo Stopping AOT-SMS...
echo.

echo [1/2] Stopping Tomcat...
taskkill /F /IM java.exe 2>nul
echo       Done.
echo.

echo [2/2] Stopping frontend dev server...
taskkill /F /FI "WINDOWTITLE eq AOT-SMS Frontend*" 2>nul
echo       Done.
echo.

echo ============================================
echo   AOT-SMS stopped.
echo ============================================
pause
