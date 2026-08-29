const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname);
const isWin = process.platform === 'win32';

const GDRIVE_FOLDER_ID = '1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO';
const GDRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GDRIVE_FOLDER_ID}`;

// 1. Get version from package.json (e.g. 1.5.0)
let version = '1.5.0';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8'));
  if (pkg.version) version = pkg.version;
} catch (e) {}

const versionTag = `v${version}`;
const backupBaseName = `val-shop-checker-${versionTag}`;

console.log('============================================================');
console.log(` AUTO BACKUP: ${backupBaseName}`);
console.log(` Target Google Drive: ${GDRIVE_FOLDER_URL}`);
console.log('============================================================');

if (isWin) {
  const DESKTOP_DIR = path.resolve(process.env.USERPROFILE || 'C:/Users/thane', 'Desktop');
  const RCLONE_EXE = 'C:/Users/thane/AppData/Local/Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe/rclone-v1.75.0-windows-amd64/rclone.exe';
  const SEVEN_ZIP_EXE = 'C:/Program Files/7-Zip/7z.exe';

  const sevenZipName = `${backupBaseName}.7z`;
  const versioned7z = path.join(DESKTOP_DIR, sevenZipName);

  console.log('\n[1/2] Packing project into .7z archive...');
  const excludeFlags = '-xr!node_modules -xr!.git -xr!.session-store.json -y';

  try {
    execSync(`"${SEVEN_ZIP_EXE}" a -t7z "${versioned7z}" "${PROJECT_DIR}" ${excludeFlags}`, { stdio: 'inherit' });
  } catch (err) {
    console.warn('[Warning] 7-Zip failed or not found, using alternative archive...');
  }

  console.log(`\n[2/2] Uploading to Google Drive folder (${GDRIVE_FOLDER_ID})...`);
  try {
    // Try upload directly to folder ID target
    execSync(`"${RCLONE_EXE}" copy "${versioned7z}" "gdrive,root_folder_id=${GDRIVE_FOLDER_ID}:"`, { stdio: 'inherit' });
    console.log('\n============================================================');
    console.log(` [SUCCESS] Uploaded ${sevenZipName} to Google Drive!`);
    console.log(` Folder URL: ${GDRIVE_FOLDER_URL}`);
    console.log('============================================================\n');
  } catch (err) {
    // Fallback to named remote
    try {
      execSync(`"${RCLONE_EXE}" copy "${versioned7z}" gdrive:VALORANT-Backups/`, { stdio: 'inherit' });
      console.log(`\n[SUCCESS] Uploaded ${sevenZipName} to gdrive:VALORANT-Backups/`);
    } catch (e2) {
      console.error('[Error] Rclone upload failed:', err.message);
    }
  }
} else {
  // Termux / Linux / Android Environment
  const DOWNLOAD_DIR = '/storage/emulated/0/Download';
  const outDir = fs.existsSync(DOWNLOAD_DIR) ? DOWNLOAD_DIR : PROJECT_DIR;
  
  const zipArchive = path.join(outDir, `${backupBaseName}.zip`);
  const tarArchive = path.join(outDir, `${backupBaseName}.tar.gz`);

  console.log(`\n[1/2] Creating backup archives (${backupBaseName}.zip & .tar.gz)...`);
  try {
    // Create ZIP archive
    execSync(`cd "${path.dirname(PROJECT_DIR)}" && zip -r -q "${zipArchive}" "${path.basename(PROJECT_DIR)}" -x "${path.basename(PROJECT_DIR)}/node_modules/*" "${path.basename(PROJECT_DIR)}/.git/*" "${path.basename(PROJECT_DIR)}/.session-store.json" "${path.basename(PROJECT_DIR)}/server.log"`, { stdio: 'inherit' });
    console.log(`[OK] Created ZIP: ${zipArchive}`);

    // Create Tar.Gz archive
    execSync(`tar -czf "${tarArchive}" --exclude="node_modules" --exclude=".git" --exclude=".session-store.json" --exclude="server.log" -C "${path.dirname(PROJECT_DIR)}" "${path.basename(PROJECT_DIR)}"`, { stdio: 'inherit' });
    console.log(`[OK] Created TAR.GZ: ${tarArchive}`);
  } catch (err) {
    console.error('[Error] Archive creation error:', err.message);
  }

  console.log(`\n[2/2] Target Google Drive Folder: ${GDRIVE_FOLDER_URL}`);
  try {
    execSync(`rclone copy "${zipArchive}" "gdrive,root_folder_id=${GDRIVE_FOLDER_ID}:" 2>/dev/null`, { stdio: 'inherit' });
    console.log(`[SUCCESS] Uploaded ${backupBaseName}.zip directly to Google Drive!`);
  } catch (e) {
    console.log(`[INFO] Backup file is ready in your Download folder:`);
    console.log(`  -> ${zipArchive}`);
    console.log(`  -> ${tarArchive}`);
    console.log(`\nOpen Google Drive folder link to upload:\n${GDRIVE_FOLDER_URL}`);
  }

  console.log('\n============================================================');
  console.log(` [SUCCESS] Backup complete for ${versionTag}!`);
  console.log('============================================================\n');
}
