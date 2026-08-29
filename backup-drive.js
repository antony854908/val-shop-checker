const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname);
const isWin = process.platform === 'win32';

// 1. Get version from package.json (e.g. 1.5.0)
let version = '1.5.0';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8'));
  if (pkg.version) version = pkg.version;
} catch (e) {}

const versionTag = `v${version}`;
const backupName = `val-shop-checker-${versionTag}`;

console.log('============================================================');
console.log(` AUTO BACKUP: ${backupName}`);
console.log('============================================================');

if (isWin) {
  const DESKTOP_DIR = path.resolve(process.env.USERPROFILE || 'C:/Users/thane', 'Desktop');
  const RCLONE_EXE = 'C:/Users/thane/AppData/Local/Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe/rclone-v1.75.0-windows-amd64/rclone.exe';
  const SEVEN_ZIP_EXE = 'C:/Program Files/7-Zip/7z.exe';

  const sevenZipName = `${backupName}.7z`;
  const versioned7z = path.join(DESKTOP_DIR, sevenZipName);

  console.log('\n[1/2] Packing project into .7z archive...');
  const excludeFlags = '-xr!node_modules -xr!.git -xr!.session-store.json -y';

  try {
    execSync(`"${SEVEN_ZIP_EXE}" a -t7z "${versioned7z}" "${PROJECT_DIR}" ${excludeFlags}`, { stdio: 'inherit' });
  } catch (err) {
    console.warn('[Warning] 7-Zip executable not found or failed, falling back to powershell...');
  }

  console.log('\n[2/2] Uploading to Google Drive (gdrive:VALORANT-Backups/)...');
  try {
    execSync(`"${RCLONE_EXE}" copy "${versioned7z}" gdrive:VALORANT-Backups/`, { stdio: 'inherit' });
    console.log('\nGoogle Drive File List:');
    execSync(`"${RCLONE_EXE}" ls gdrive:VALORANT-Backups/`, { stdio: 'inherit' });
    console.log('\n============================================================');
    console.log(` [SUCCESS] Uploaded ${sevenZipName} to Google Drive!`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('[Error] Rclone upload failed:', err.message);
  }
} else {
  // Termux / Linux / Android Environment
  const DOWNLOAD_DIR = '/storage/emulated/0/Download';
  const targetArchive = path.join(fs.existsSync(DOWNLOAD_DIR) ? DOWNLOAD_DIR : PROJECT_DIR, `${backupName}.tar.gz`);

  console.log(`\n[1/2] Creating backup archive ${targetArchive}...`);
  try {
    execSync(`tar -czf "${targetArchive}" --exclude="node_modules" --exclude=".git" --exclude=".session-store.json" --exclude="server.log" -C "${path.dirname(PROJECT_DIR)}" "${path.basename(PROJECT_DIR)}"`, { stdio: 'inherit' });
    console.log(`[OK] Created: ${targetArchive}`);
  } catch (err) {
    console.error('[Error] Archive creation failed:', err.message);
  }

  console.log('\n[2/2] Syncing to Google Drive / External Storage...');
  try {
    execSync(`rclone copy "${targetArchive}" gdrive:VALORANT-Backups/ 2>/dev/null`, { stdio: 'inherit' });
    console.log(`[SUCCESS] Uploaded ${backupName}.tar.gz to Google Drive!`);
  } catch (e) {
    console.log(`[INFO] Archive is ready in Downloads folder: ${targetArchive}`);
    console.log('You can upload it to Google Drive directly or run backup-to-gdrive.bat on your PC.');
  }

  console.log('\n============================================================');
  console.log(` [SUCCESS] Backup complete for ${versionTag}!`);
  console.log('============================================================\n');
}
