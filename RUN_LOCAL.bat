@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title Karbala Sewerage Audit System - Local

echo ============================================================
echo   Karbala Sewerage Directorate - Audit Division
echo   Local test mode - SQLite
echo ============================================================
echo.

set "PY_CMD="
where py >nul 2>&1
if not errorlevel 1 set "PY_CMD=py"
if defined PY_CMD goto python_found
where python >nul 2>&1
if not errorlevel 1 set "PY_CMD=python"

:python_found
if not defined PY_CMD goto no_python

echo [1/4] Python detected:
%PY_CMD% --version
echo.

echo [2/4] Checking local requirements...
%PY_CMD% -c "import flask, flask_sqlalchemy, sqlalchemy, openpyxl; print('Local requirements are ready.')" >nul 2>&1
if errorlevel 1 goto install_requirements
goto requirements_ready

:install_requirements
echo Required packages are missing. Installing them now...
echo PostgreSQL driver is NOT required for local testing.
%PY_CMD% -m pip install -r requirements-local.txt
if errorlevel 1 goto install_failed

echo.
echo Verifying the installation...
%PY_CMD% -c "import flask, flask_sqlalchemy, sqlalchemy, openpyxl; print('OK')" >nul 2>&1
if errorlevel 1 goto verify_failed

:requirements_ready
echo [3/4] Local requirements are ready.
echo [4/4] Starting the system...
echo.
set "DATABASE_URL="
set "COOKIE_SECURE=0"
%PY_CMD% app.py
goto program_stopped

:no_python
echo [ERROR] Python was not found on this computer.
echo Install Python 3.10 or newer and enable Add Python to PATH.
echo.
pause
exit /b 1

:install_failed
echo.
echo [ERROR] Package installation failed.
echo Copy the error above and send it for review.
pause
exit /b 1

:verify_failed
echo.
echo [ERROR] Packages were downloaded, but Python still cannot import them.
echo Send a screenshot of this window for review.
pause
exit /b 1

:program_stopped
echo.
echo The program has stopped.
pause
exit /b 0
