#!/bin/bash
# VALORANT Store 1-Tap Launcher
APP_DIR="/data/data/com.termux/files/home/val-shop-checker"
PORT=3000

# 1. Acquire wake lock so Android doesn't sleep
/data/data/com.termux/files/usr/bin/termux-wake-lock 2>/dev/null || true

# 2. Check if server is running, if not start it
if ! pgrep -f "node /data/data/com.termux/files/home/val-shop-checker/server.js" > /dev/null && ! pgrep -f "node server.js" > /dev/null; then
  echo "🚀 กำลังเริ่มเซิร์ฟเวอร์ VALORANT Store..."
  cd "$APP_DIR"
  nohup node server.js </dev/null >server.log 2>&1 &
  sleep 2
fi

# 3. Open browser / PWA directly
if [ -f /data/data/com.termux/files/usr/bin/termux-open-url ]; then
  /data/data/com.termux/files/usr/bin/termux-open-url "http://localhost:${PORT}"
else
  am start -a android.intent.action.VIEW -d "http://localhost:${PORT}" 2>/dev/null || true
fi

echo "✅ เปิดแอป VALORANT Store เรียบร้อยแล้ว!"
