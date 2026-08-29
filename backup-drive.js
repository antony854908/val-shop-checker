const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname);
const isWin = process.platform === 'win32';

const GDRIVE_FOLDER_ID = '1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO';
const GDRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GDRIVE_FOLDER_ID}`;

// 1. Get version from package.json (e.g. 1.5.1)
let version = '1.5.1';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8'));
  if (pkg.version) version = pkg.version;
} catch (e) {}

const versionTag = `v${version}`;
const sevenZipName = `val-shop-checker-${versionTag}.7z`;

console.log('============================================================');
console.log(` AUTO BACKUP: ${sevenZipName} (7z Format)`);
console.log(` Target Google Drive: ${GDRIVE_FOLDER_URL}`);
console.log('============================================================');

if (isWin) {
  const DESKTOP_DIR = path.resolve(process.env.USERPROFILE || 'C:/Users/thane', 'Desktop');
  const RCLONE_EXE = 'C:/Users/thane/AppData/Local/Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe/rclone-v1.75.0-windows-amd64/rclone.exe';
  const SEVEN_ZIP_EXE = 'C:/Program Files/7-Zip/7z.exe';

  const versioned7z = path.join(DESKTOP_DIR, sevenZipName);

  console.log('\n[1/2] Packing project into .7z archive...');
  const excludeFlags = '-xr!node_modules -xr!.git -xr!.session-store.json -y';

  try {
    execSync(`"${SEVEN_ZIP_EXE}" a -t7z "${versioned7z}" "${PROJECT_DIR}" ${excludeFlags}`, { stdio: 'inherit' });
  } catch (err) {
    console.warn('[Warning] 7-Zip failed, trying native 7z command...');
    execSync(`7z a -t7z "${versioned7z}" "${PROJECT_DIR}" ${excludeFlags}`, { stdio: 'inherit' });
  }

  console.log(`\n[2/2] Uploading ${sevenZipName} to Google Drive (${GDRIVE_FOLDER_ID})...`);
  try {
    execSync(`"${RCLONE_EXE}" copy "${versioned7z}" "gdrive,root_folder_id=${GDRIVE_FOLDER_ID}:"`, { stdio: 'inherit' });
    console.log('\n============================================================');
    console.log(` [SUCCESS] Uploaded ${sevenZipName} to Google Drive!`);
    console.log(` Folder URL: ${GDRIVE_FOLDER_URL}`);
    console.log('============================================================\n');
  } catch (err) {
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
  const versioned7z = path.join(outDir, sevenZipName);

  // Auto-detect and import rclone.conf from Downloads/SD card if present
  const termuxRcloneConf = path.join(process.env.HOME || '/data/data/com.termux/files/home', '.config/rclone/rclone.conf');
  if (!fs.existsSync(termuxRcloneConf)) {
    const candidateConfigs = [
      '/storage/emulated/0/Download/rclone.conf',
      '/storage/emulated/0/rclone.conf',
      '/sdcard/Download/rclone.conf',
      '/sdcard/rclone.conf'
    ];
    for (const cand of candidateConfigs) {
      if (fs.existsSync(cand)) {
        try {
          fs.mkdirSync(path.dirname(termuxRcloneConf), { recursive: true });
          fs.copyFileSync(cand, termuxRcloneConf);
          console.log(`[Auto-Config] Imported rclone config from ${cand}`);
          break;
        } catch (e) {}
      }
    }
  }

  console.log(`\n[1/2] Packing project into ${sevenZipName} (7z Format)...`);
  const excludeFlags = '-xr!node_modules -xr!.git -xr!.session-store.json -xr!server.log -y';
  try {
    execSync(`7z a -t7z "${versioned7z}" "${PROJECT_DIR}" ${excludeFlags}`, { stdio: 'inherit' });
    console.log(`[OK] Created .7z Archive: ${versioned7z}`);
  } catch (err) {
    console.error('[Error] 7z packing failed:', err.message);
  }

  console.log(`\n[2/2] Uploading ${sevenZipName} to Google Drive (${GDRIVE_FOLDER_ID})...`);
  let uploaded = false;
  try {
    execSync(`rclone copy "${versioned7z}" "gdrive,root_folder_id=${GDRIVE_FOLDER_ID}:"`, { stdio: 'inherit' });
    console.log(`[SUCCESS] Uploaded ${sevenZipName} directly to Google Drive!`);
    uploaded = true;
  } catch (e) {
    try {
      execSync(`rclone copy "${versioned7z}" gdrive:VALORANT-Backups/`, { stdio: 'inherit' });
      console.log(`[SUCCESS] Uploaded ${sevenZipName} to gdrive:VALORANT-Backups/!`);
      uploaded = true;
    } catch (e2) {
      console.error('[Error] Rclone upload failed:', e.message);
    }
  }

  if (!uploaded) {
    console.log(`[INFO] .7z Backup file is ready in your Download folder:`);
    console.log(`  -> ${versioned7z}`);
    console.log(`\nOpen Google Drive folder link to upload:\n${GDRIVE_FOLDER_URL}`);
  }

  console.log('\n============================================================');
  console.log(` [SUCCESS] Backup complete for ${versionTag}! (.7z uploaded)`);
  console.log('============================================================\n');
}
