@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title Fix Local Requirements

set "PY_CMD="
where py >nul 2>&1 && set "PY_CMD=py"
if not defined PY_CMD where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD goto no_python

echo Installing only the packages required for local SQLite testing...
%PY_CMD% -m pip install -r requirements-local.txt
if errorlevel 1 goto install_failed

echo.
echo Verifying installation...
%PY_CMD% -c "import flask, flask_sqlalchemy, sqlalchemy, openpyxl; print('OK')"
if errorlevel 1 goto verify_failed

echo.
echo Local requirements installed successfully.
echo Now run RUN_LOCAL.bat
pause
exit /b 0

:no_python
echo Python was not found.
pause
exit /b 1

:install_failed
echo.
echo Installation failed. Send a screenshot of this window.
pause
exit /b 1

:verify_failed
echo.
echo Installation completed but the import test failed.
echo Send a screenshot of this window.
pause
exit /b 1
