# FiberQuest Games Database — Local Configuration (NOT Git)

## Philosophy

**No hardcoding. No GitHub. User-owned.**

- Games metadata lives **locally** on user's machine
- Secrets (API keys) stored in **~/.fiberquest/.env** (gitignored)
- Custom games defined in **~/.fiberquest/games-db.json** (user-editable)
- Source of truth = **user's local file**, not cloud

This is how open-source should work:
- Ship the tool
- User configures it
- Zero hardcoded paths/keys

---

## Directory Structure

```
~/.fiberquest/                    ← User's local FiberQuest config
├── .env                          ← SECRETS (API keys, never commit)
├── games-db.json                 ← Games metadata (user-owned)
├── games-db-custom.json          ← Optional: user additions
├── cache/
│   ├── thegamesdb/               ← Cached API responses
│   └── covers/                   ← Downloaded game images
└── logs/
    └── update-games-db.log       ← Metadata fetch logs
```

**Key:** Nothing here goes to GitHub. All user-local.

---

## Setup Process

### 1. Installer Creates Base Structure

```bash
bash fiberquest-installer.sh
```

Creates:
- `~/.fiberquest/` directory
- `~/.fiberquest/.env` (empty template)
- `~/.fiberquest/games-db.json` (stub with 3 example games)
- `~/.fiberquest/update-games-db.sh` (manual refresh script)

### 2. User Populates .env (One-Time)

```bash
vi ~/.fiberquest/.env
```

```env
# Get free key from: https://thegamesdb.net/user/register
THEGAMESDB_API_KEY="your-api-key-here"

# Optional: IGDB setup
IGDB_CLIENT_ID=""
IGDB_ACCESS_TOKEN=""
```

**This file is .gitignored — never leaves user's machine.**

### 3. User Customizes games-db.json

Either:
- **Option A:** Run update script to pull from TheGamesDB API
  ```bash
  bash ~/.fiberquest/update-games-db.sh
  ```

- **Option B:** Manually edit games-db.json
  ```bash
  vi ~/.fiberquest/games-db.json
  ```

- **Option C:** Add personal games to games-db-custom.json
  ```json
  {
    "games": [
      {
        "id": "custom-romhack",
        "title": "My ROM Hack",
        "system": "gba",
        "description": "Custom Pokemon ROM hack",
        "validCRCs": ["mycustomcrc123"],
        "validator": "pokefr-validator.js",
        ...
      }
    ]
  }
  ```

---

## Daemon Integration

### fiberquestd API — Load Games DB

The daemon (Express server) loads games-db.json:

```javascript
// daemon/index.js

const fs = require('fs');
const path = require('path');

function loadGamesDB() {
  const gamesDbPath = path.expandUser('~/.fiberquest/games-db.json');
  
  if (!fs.existsSync(gamesDbPath)) {
    console.error(`Games DB not found: ${gamesDbPath}`);
    console.log(`Run: bash ~/.fiberquest/update-games-db.sh`);
    process.exit(1);
  }
  
  const data = fs.readFileSync(gamesDbPath, 'utf8');
  return JSON.parse(data);
}

// Load on startup
const gamesDB = loadGamesDB();

// API endpoint
app.get('/api/games-db', (req, res) => {
  res.json(gamesDB);
});

// Merge custom games (optional)
app.get('/api/games-db/with-custom', (req, res) => {
  const customPath = path.expandUser('~/.fiberquest/games-db-custom.json');
  let customGames = [];
  
  if (fs.existsSync(customPath)) {
    const custom = JSON.parse(fs.readFileSync(customPath, 'utf8'));
    customGames = custom.games || [];
  }
  
  res.json({
    ...gamesDB,
    games: [...gamesDB.games, ...customGames]
  });
});
```

### Electron Frontend — Consume API

Electron fetches from daemon (not hardcoded):

```typescript
// src/pages/games.tsx

async function loadGames() {
  const response = await fetch('http://localhost:3001/api/games-db/with-custom');
  const gameMetadata = await response.json();
  
  // Scan local ROMs against metadata
  const installed = await scanInstalledROMs(gameMetadata.games);
  
  setGames(installed);
}
```

---

## User Workflows

### Workflow 1: Minimal (Skip API Integration)

1. Install FiberQuest
2. Games-db.json already has 3 example games
3. User manually adds more games by editing JSON
4. No API keys needed
5. Works offline

### Workflow 2: With TheGamesDB API

1. Install FiberQuest
2. Get free API key from TheGamesDB
3. Add to `~/.fiberquest/.env`
4. Run `bash ~/.fiberquest/update-games-db.sh`
5. Metadata auto-fetched + cached

### Workflow 3: Custom ROM Hacks

1. Create `~/.fiberquest/games-db-custom.json`
2. Add entries for your ROM hacks
3. Daemon merges both files (main + custom)
4. Electron sees all games

### Workflow 4: Behind Existing RetroArch

1. Install FiberQuest daemon only (`--headless`)
2. Daemon still loads ~/.fiberquest/games-db.json
3. User configures games-db.json once
4. RetroArch (somewhere else) calls daemon API
5. Works with user's existing setup

---

## Open Source Best Practices

✅ **What We Do Right:**
- No hardcoded API keys
- No secrets in git
- User-owned configuration
- Flexible file paths
- Works offline (API optional)
- Respects user's RetroArch setup

✅ **What Users Get:**
- Full control over games
- Can add custom ROMs
- Can configure API keys
- Can override everything via JSON
- Zero vendor lock-in

---

## Command Reference

### First-time setup
```bash
bash fiberquest-installer.sh
vi ~/.fiberquest/.env              # Add API keys
bash ~/.fiberquest/update-games-db.sh  # Fetch metadata (optional)
```

### Edit games
```bash
vi ~/.fiberquest/games-db.json     # Main database
vi ~/.fiberquest/games-db-custom.json  # User additions
```

### Check current config
```bash
cat ~/.fiberquest/.env
cat ~/.fiberquest/games-db.json | jq '.games[] | {id, title, system}'
```

### Rebuild from scratch
```bash
rm -rf ~/.fiberquest
bash fiberquest-installer.sh
```

---

## Security

**Secrets (.env):**
- Never version-controlled
- Never committed to git
- Chmod 600 (user-read-only)
- Can be rotated anytime

**Games DB (games-db.json):**
- User-owned, not shared
- CRCs prevent ROM tampering
- Custom additions work offline

**Daemon:**
- Only loads local files
- No outbound calls (except optional API refresh)
- User controls what API keys are set

---

## Troubleshooting

### "Games DB not found"
```bash
bash ~/.fiberquest/update-games-db.sh
```

### "API key invalid"
Check `~/.fiberquest/.env` and verify key is correct

### "Can't find my ROM"
1. Verify file in `~/fiberquest/games/{system}/`
2. Check extension matches `expectedExtensions` in games-db.json
3. Verify CRC: `sha256sum filename.gba` (or use CRC32 tool)

### Want to add a custom game?
Edit `~/.fiberquest/games-db-custom.json` and add entry

---

**This is how you build open-source properly: Ship the tool, user owns the config.** 🔓
