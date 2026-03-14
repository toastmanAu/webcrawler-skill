#!/bin/bash
# Copy Electron sidecar files to FiberQuest Pi

PIHOST="fiberquest"

echo "Copying Electron sidecar files to $PIHOST..."
echo ""

# Copy main files
scp fiberquest-electron-main.js $PIHOST:~/fiberquest-electron/main.js
scp fiberquest-electron-preload.js $PIHOST:~/fiberquest-electron/preload.js
scp fiberquest-electron-index.html $PIHOST:~/fiberquest-electron/index.html
scp fiberquest-electron-package.json $PIHOST:~/fiberquest-electron/package.json

echo ""
echo "✅ Files copied. Now SSH to install:"
echo ""
echo "  ssh $PIHOST"
echo "  cd ~/fiberquest-electron"
echo "  npm install"
echo ""
echo "Then start with:"
echo "  npm run dev    (with DevTools)"
echo "  npm start      (production)"
echo ""
