@echo off
title Auto Backup to Google Drive
cd /d "%~dp0"

node backup-drive.js

pause
