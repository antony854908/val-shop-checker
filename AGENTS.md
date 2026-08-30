# Workspace Rules & Automation Protocol

## Target Links:
- **GitHub**: https://github.com/antony854908/val-shop-checker
- **Live Vercel**: https://val-shop-checker.vercel.app
- **Google Drive Backup Folder**: https://drive.google.com/drive/folders/1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO

## Strict Order of Execution on EVERY Update:
1. **[1st] Deploy to Server FIRST (อัปขึ้นเซิร์ฟเวอร์ก่อน):**
   - Stage & commit all changes.
   - Push to GitHub `main` (`git push origin main`).
   - Deploy immediately to Vercel production (`npx vercel --prod --yes`).
   - Verify server is live (`HTTP 200`).
2. **[2nd] Upload to Google Drive SECOND (อัปขึ้น Google Drive ทีหลัง):**
   - Increment version in `package.json` (e.g. `1.5.2`, `1.5.3`).
   - Sync all files to `/storage/emulated/0/Download/val-shop-checker/`.
   - Run `node backup-drive.js` to create `val-shop-checker-v<version>.7z`.
   - Upload the new `.7z` file to Google Drive folder `1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO`.
   - Keep all past version `.7z` files on Google Drive (never overwrite/delete old `.7z` files).
3. **[3rd] UI Design Standard:**
   - Keep UI clean without raw emojis; use crisp SVG icons and text badges.
