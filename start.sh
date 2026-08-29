#!/bin/bash
cd "$(dirname "$0")"

PORT=${PORT:-3000}

# Get local IP
LOCAL_IP=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n 1)

echo "============================================================"
echo "          VALORANT STORE & SKIN INSPECTOR"
echo "============================================================"
echo " กำลังเริ่มระบบความปลอดภัย Zero-Leak Memory Session..."
echo " Web UI บนเครื่องนี้:  http://localhost:${PORT}"
if [ ! -z "$LOCAL_IP" ]; then
  echo " ให้คนอื่นใน WiFi เปิด: http://${LOCAL_IP}:${PORT}"
fi
echo "============================================================"
echo " กด Ctrl+C เพื่อหยุดการทำงาน"
echo "============================================================"

node server.js
