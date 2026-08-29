@echo off
title VALORANT Store & Skin Inspector
cd /d "%~dp0"

echo ============================================================
echo          VALORANT STORE & SKIN INSPECTOR (PC LOCAL)
echo ============================================================
echo.
echo  [1/2] Checking dependencies...
if not exist node_modules (
  echo  Installing npm packages...
  call npm install
)

echo  [2/2] Starting server at http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js

pause
