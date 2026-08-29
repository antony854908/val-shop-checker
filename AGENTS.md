# Workspace Rules & Automation Protocol

## Target Links:
- **GitHub**: https://github.com/antony854908/val-shop-checker
- **Live Vercel**: https://val-shop-checker.vercel.app
- **Google Drive Backup Folder**: https://drive.google.com/drive/folders/1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO

## Automation Workflow on Every Update:
1. Stage, commit, and push all updates to GitHub `main` (auto-deploys to Vercel).
2. Sync all files to `/storage/emulated/0/Download/val-shop-checker/`.
3. Run `node backup-drive.js` to create updated `.zip` & `.tar.gz` archives in `/storage/emulated/0/Download/` and sync to Google Drive.
4. Keep UI clean without raw emojis (use SVG icons and text badges).
