# Workspace Rules & Automation Protocol

## Target Links:
- **GitHub**: https://github.com/antony854908/val-shop-checker
- **Live Vercel**: https://val-shop-checker.vercel.app
- **Google Drive Backup Folder**: https://drive.google.com/drive/folders/1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO

## Automation Workflow & Versioning Rules:
1. **Version Increment & Separate 7z Archives**:
   - Increment version in `package.json` with every update (e.g. `1.5.1`, `1.5.2`, `1.5.3`).
   - Pack and upload backup exclusively as `val-shop-checker-v<version>.7z`.
   - Preserve all past version archives separately on Google Drive (never overwrite/delete old `.7z` versions).
2. **Multi-Target Deployment**:
   - Push to GitHub `main` and deploy to Vercel production (`npx vercel --prod --yes`).
   - Sync all files to `/storage/emulated/0/Download/val-shop-checker/`.
   - Run `node backup-drive.js` to upload the new `.7z` archive to Google Drive automatically.
3. **Clean UI Standards**:
   - Zero raw emojis on web interface; use crisp SVG icons and text badges.
