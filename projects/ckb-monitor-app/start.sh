#!/bin/bash
# Start CKB Monitor dev server using Node 22 (required for Expo 52 compatibility)
export PATH="/home/linuxbrew/.linuxbrew/opt/node@22/bin:$PATH"
cd "$(dirname "$0")"
echo "Using Node: $(node --version)"
npx expo start "$@"
