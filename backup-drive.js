const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname);
const DESKTOP_DIR = path.resolve(process.env.USERPROFILE || 'C:/Users/thane', 'Desktop');
const RCLONE_EXE = 'C:/Users/thane/AppData/Local/Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe/rclone-v1.75.0-windows-amd64/rclone.exe';
const SEVEN_ZIP_EXE = 'C:/Program Files/7-Zip/7z.exe';

// 1. Get version from package.json (e.g. 1.1.0)
let version = '1.1.0';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8'));
  if (pkg.version) version = pkg.version;
} catch (e) {}

const versionTag = `v${version}`;
const sevenZipName = `val-shop-checker-${versionTag}.7z`;

console.log('============================================================');
console.log(` AUTO BACKUP: ${sevenZipName}`);
console.log('============================================================');

const versioned7z = path.join(DESKTOP_DIR, sevenZipName);

console.log('\n[1/2] Packing project into .7z archive...');
const excludeFlags = '-xr!node_modules -xr!.git -xr!.session-store.json -y';

// Create Only .7z Archive
execSync(`"${SEVEN_ZIP_EXE}" a -t7z "${versioned7z}" "${PROJECT_DIR}" ${excludeFlags}`, { stdio: 'inherit' });

console.log('\n[2/2] Uploading to Google Drive (gdrive:VALORANT-Backups/)...');
execSync(`"${RCLONE_EXE}" copy "${versioned7z}" gdrive:VALORANT-Backups/`, { stdio: 'inherit' });

console.log('\nGoogle Drive File List:');
execSync(`"${RCLONE_EXE}" ls gdrive:VALORANT-Backups/`, { stdio: 'inherit' });

console.log('\n============================================================');
console.log(` [SUCCESS] Uploaded ${sevenZipName} to Google Drive!`);
console.log('============================================================\n');
