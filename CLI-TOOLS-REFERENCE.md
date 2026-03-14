# CLI Tools Installed — FiberQuest Development

## Code Quality & Formatting
```bash
prettier --write src/*.js              # Auto-format JavaScript
eslint src/*.js --fix                  # Auto-fix linting issues
markdownlint *.md --fix                # Validate/fix markdown
```

## Crypto & Blockchain
```bash
# Node.js crypto libraries (require statements)
# ethers          — Ethereum + other EVM chains
# web3            — Ethereum/blockchain interaction
# @noble/hashes   — Pure crypto hashing (SHA256, BLAKE2b, etc.)
# @noble/secp256k1 — Elliptic curve crypto (used in BTC/CKB)
# tweetnacl       — NaCl crypto library (signing)
# bitcoinjs-lib   — Bitcoin transaction building

# Usage in Node:
node -e "const ethers = require('ethers'); console.log(ethers.version)"
node -e "const noble = require('@noble/secp256k1'); console.log(noble.version)"
```

## Data & Config
```bash
jq .                                   # Parse/pretty-print JSON
yq eval . file.yaml                    # Parse/pretty-print YAML
xxd -l 128 file.bin                    # Hex dump binary files
hexdump -C file.bin | head -20         # Human-readable hex
```

## Web & Server Tools
```bash
http-server -p 8000                    # Simple HTTP server
serve -l 3000 public/                  # Production-like server
live-server public/                    # Auto-reload dev server
ws wss://echo.websocket.org            # WebSocket client (test)
```

## Development & Build
```bash
# Web Frameworks (installed globally)
ng new app                             # Angular project
vue create app                         # Vue.js project
create-react-app app                   # React project
svelte-add ...                         # Svelte template

# Build tools
webpack --mode production              # Bundle with Webpack
rollup -c                              # Bundle with Rollup
vite build                             # Build with Vite
gulp                                   # Task runner
grunt                                  # Task runner

# Monorepo tools
turbo run build                        # Monorepo build orchestration
nx affected:build                      # Monorepo build smart cache
```

## Media & Binary
```bash
xxd file.bin > file.hex                # Create hex dump
hexdump -C file.bin                    # View hex
ffmpeg -i video.mp4 frame_%04d.png     # Extract frames
convert image.png -resize 50% small.png # Image manipulation
identify image.png                     # Image info
```

## Crypto & Libraries (System)
```bash
pkg-config --modversion libsodium      # Check libsodium (1.0.18 installed)
pkg-config --cflags --libs libsodium   # Compile flags
```

## CKB Hackathon Stack (Installed Globally + in FiberQuest)

### Core Packages
```bash
# Main CKB libraries
@ckb-ccc/ccc           - Common Chains Connector (transaction building)
@ckb-ccc/core          - CCC core utilities
@ckb-ccc/spore         - Spore protocol (NFT standard)
@ckb-ccc/connector     - Wallet connection UI
@ckb-ccc/connector-react - React integration
@ckb-ccc/ssri          - SSRI protocol support

# Nervos Network SDK
@nervosnetwork/ckb-sdk-utils  - Utility functions
@nervosnetwork/ckb-types      - TypeScript types

# Crypto utilities
blake2b                - BLAKE2b hashing (used by CKB)
bignumber.js           - Arbitrary precision arithmetic
```

### Usage in FiberQuest
```javascript
// In src/tournament-manager.js or src/agent-wallet.js
const ccc = require('@ckb-ccc/ccc');
const { Spore } = require('@ckb-ccc/spore');
const utils = require('@nervosnetwork/ckb-sdk-utils');
const blake2b = require('blake2b');

// Build CKB transaction
const { Signer, RPC } = ccc;
const rpc = new RPC('https://testnet-api.nervos.org');
const signer = /* wallet signer from CCC */;

// Create cell, sign, send...
```

## How I'll Use These for FiberQuest

### Phase 2: Tournament Manager (CKB)
```bash
# Check for errors before running
eslint src/tournament-manager.js --fix
# Format code
prettier --write src/tournament-manager.js
# Test locally
node -e "const ethr = require('ethers'); const { CCC } = require('@ckb-ccc/core'); console.log('Ready')"
```

### Phase 3: Fiber Integration
```bash
# Test Fiber RPC client
ws wss://fiber-testnet.example.com
# Check protocol buffers or message structures
xxd proto-file.bin | head
```

### Phase 4: Electron UI
```bash
# Build UI with live reload
live-server renderer/
# Format all files before commit
prettier --write renderer/**/*.{js,html,css}
```

### Phase 5: End-to-End Testing
```bash
# Parse transaction output
node -e "const web3 = require('web3'); /* test */"`
# Validate JSON configs
jq . games/harvest-moon-snes.json
# Hex-dump transaction signatures
xxd signed-tx.bin | head -20
```

## Version Check
```bash
prettier --version
eslint --version
node --version
npm --version
```

## All Installed Tools Summary
- ✅ **Formatters:** prettier (JS/JSON/YAML), markdownlint
- ✅ **Linters:** eslint
- ✅ **Crypto:** ethers, web3, @noble/hashes, @noble/secp256k1, tweetnacl, bitcoinjs-lib, libsodium (system)
- ✅ **Data:** jq, yq, xxd, hexdump, git-lfs
- ✅ **Web:** http-server, serve, live-server, ws (WebSocket client)
- ✅ **Frameworks:** Angular CLI, Vue CLI, create-react-app, Svelte, Webpack, Rollup, Vite, Gulp, Grunt, Turbo, Nx
- ✅ **Media:** ffmpeg (video/audio), imagemagick (image processing)
- ✅ **Build:** build-essential (gcc, make, etc.)

---

**Access Level:** NOPASSWD sudo enabled (installed 2026-03-14)  
**Ready to use!** Commands above are all available globally from any terminal.
