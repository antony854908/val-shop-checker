#!/bin/bash
echo "============================================================"
echo "    GOOGLE DRIVE PAIRING FOR VAL-SHOP-CHECKER (TERMUX)"
echo "============================================================"
echo ""
echo "Setting up Google Drive remote targeting folder:"
echo "https://drive.google.com/drive/folders/1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO"
echo ""

mkdir -p ~/.config/rclone

# Check if rclone is installed
if ! command -v rclone &> /dev/null; then
    echo "Installing rclone..."
    pkg install -y rclone
fi

echo "Starting rclone config..."
echo "1. Type 'n' (New remote)"
echo "2. Name: 'gdrive'"
echo "3. Storage: 'drive' (Google Drive)"
echo "4. Client ID / Secret: (Leave blank - press Enter)"
echo "5. Scope: '1' (Full access)"
echo "6. root_folder_id: '1NyEazkvXnEUfUJ7-kVRD69_rBxDYrVRO'"
echo ""

rclone config

echo ""
echo "Setup complete! Now every backup will automatically upload directly to Google Drive."
