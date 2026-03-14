# FiberQuest Games Database — GitHub + Local Sync

## Architecture

```
GitHub (Public)
└── fiberquest-games-db/
    ├── games-db.json          ← Master database (updateable)
    ├── images/
    │   ├── covers/            ← Game artwork
    │   ├── screenshots/       ← In-game shots
    │   └── thumbs/            ← UI thumbnails
    └── validators/            ← Game-specific validators

User's Machine (Local)
└── ~/.fiberquest/
    ├── games-db.json          ← Synced from GitHub (pull)
    ├── games-db-custom.json   ← User additions (never sync)
    ├── .env                   ← Secrets (never sync)
    ├── cache/                 ← Downloaded images
    └── images/                ← Local copy of GitHub images
```

## Workflow

### Daemon Startup

```
fiberquestd starts
  ↓
Check ~/.fiberquest/games-db.json version
  ↓
If outdated:
  git clone/pull from GitHub repo
  ↓
  Download missing images to ~/.fiberquest/images/
  ↓
  Cache metadata in memory
  ↓
Load custom overrides from ~/.fiberquest/games-db-custom.json
  ↓
API ready: /api/games-db
```

### User Updates Games DB

```
You update GitHub repo:
  - Add new game to games-db.json
  - Upload cover art to images/covers/
  - Commit & push

User's daemon:
  - Checks for updates (on startup or via webhook)
  - Auto-pulls latest games-db.json
  - Syncs new images
  - User sees new games next session
```

## GitHub Repository Structure

```yaml
# fiberquest-games-db (public repo on GitHub)

games-db.json
├── version: "1.0.0"
├── lastUpdated: "2026-03-14T19:18:00Z"
├── games:
│   - id: "pokefr"
│     title: "Pokémon Fire Red"
│     imageUrl: "images/covers/pokefr.jpg"  ← GitHub raw URL
│     screenshotUrl: "images/screenshots/pokefr-01.jpg"
│     validCRCs: [...]
│     validator: "pokefr"
│     ...
│   - id: "mk2"
│     ...

images/
├── covers/
│   ├── pokefr.jpg
│   ├── mk2.jpg
│   ├── mk64.jpg
│   └── ...
├── screenshots/
│   ├── pokefr-01.jpg
│   ├── pokefr-02.jpg
│   ├── mk2-battle.jpg
│   └── ...
└── thumbs/
    ├── pokefr-thumb.jpg
    ├── mk2-thumb.jpg
    └── ...

validators/
├── pokefr-validator.js
├── mk2-validator.js
├── mk64-validator.js
└── ...

README.md
LICENSE
```

## Daemon Code (Sync Logic)

```javascript
// daemon/games-db-sync.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

const GITHUB_REPO = 'https://github.com/toastmanAu/fiberquest-games-db.git';
const LOCAL_DB_DIR = path.expandUser('~/.fiberquest');
const GAMES_DB_PATH = path.join(LOCAL_DB_DIR, 'games-db.json');
const IMAGES_DIR = path.join(LOCAL_DB_DIR, 'images');
const VALIDATORS_DIR = path.join(LOCAL_DB_DIR, 'validators');

async function syncGamesDB() {
  const tempDir = '/tmp/fiberquest-games-db-sync';
  
  try {
    console.log('🔄 Syncing games database from GitHub...');
    
    // Clone repo to temp location
    await exec(`git clone ${GITHUB_REPO} ${tempDir}`);
    
    // Copy games-db.json
    const remoteDB = path.join(tempDir, 'games-db.json');
    const localDB = GAMES_DB_PATH;
    
    fs.copyFileSync(remoteDB, localDB);
    console.log('✅ games-db.json synced');
    
    // Download images
    await syncImages(path.join(tempDir, 'images'));
    console.log('✅ Images synced');
    
    // Download validators
    await syncValidators(path.join(tempDir, 'validators'));
    console.log('✅ Validators synced');
    
    // Cleanup
    exec(`rm -rf ${tempDir}`);
    
    return { success: true, syncedAt: new Date() };
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function syncImages(remoteImgDir) {
  if (!fs.existsSync(remoteImgDir)) return;
  
  // Copy entire images directory
  exec(`cp -r ${remoteImgDir} ${IMAGES_DIR}`);
}

async function syncValidators(remoteValDir) {
  if (!fs.existsSync(remoteValDir)) return;
  
  // Copy validators
  exec(`cp -r ${remoteValDir} ${VALIDATORS_DIR}`);
}

// Auto-sync on startup
async function initializeGamesDB() {
  const lastSync = readLastSyncTime();
  const oneDayAgo = Date.now() - 86400000;
  
  if (!fs.existsSync(GAMES_DB_PATH) || lastSync < oneDayAgo) {
    await syncGamesDB();
    writeLastSyncTime();
  }
}

// Expose sync endpoint
app.post('/api/admin/sync-games-db', async (req, res) => {
  // Protected endpoint (requires auth)
  const result = await syncGamesDB();
  res.json(result);
});

// Graceful fallback if sync fails
function loadGamesDB() {
  if (fs.existsSync(GAMES_DB_PATH)) {
    return JSON.parse(fs.readFileSync(GAMES_DB_PATH, 'utf8'));
  }
  
  console.warn('⚠️  No local games-db.json found. Using stub.');
  return { games: [] };
}

module.exports = { syncGamesDB, initializeGamesDB, loadGamesDB };
```

## Installer Integration

Update `fiberquest-installer.sh` to clone initial games-db:

```bash
echo "📚 Cloning FiberQuest Games Database..."
git clone https://github.com/toastmanAu/fiberquest-games-db.git ~/.fiberquest/games-db-repo

# Symlink or copy initial data
cp ~/.fiberquest/games-db-repo/games-db.json ~/.fiberquest/games-db.json
cp -r ~/.fiberquest/games-db-repo/images ~/.fiberquest/images
cp -r ~/.fiberquest/games-db-repo/validators ~/.fiberquest/validators

echo "✅ Games database initialized"
```

## User Update Flow

1. **You push update to GitHub:**
   ```bash
   cd ~/fiberquest-games-db
   # Add new game to games-db.json
   # Upload new cover image to images/covers/
   git add .
   git commit -m "Add Street Fighter II"
   git push origin main
   ```

2. **User's daemon sees update:**
   - Checks GitHub for changes (on startup or periodically)
   - Auto-pulls latest games-db.json
   - Downloads new images
   - User sees new games next time Electron refreshes

3. **Optional: Manual force sync**
   ```bash
   curl -X POST http://localhost:3001/api/admin/sync-games-db
   ```

## Custom Overrides (User-Local)

User can override anything via `~/.fiberquest/games-db-custom.json`:

```json
{
  "games": [
    {
      "id": "pokefr-modded",
      "title": "Pokémon Fire Red (My ROM Hack)",
      "system": "gba",
      "validCRCs": ["mymodcrc123"],
      "validator": "pokefr-validator.js",
      "imageUrl": "file:///home/user/.fiberquest/custom-images/pokefr-mod.jpg"
    }
  ]
}
```

Daemon merges: GitHub + Custom = Final games list

## Security Notes

✅ **What's public (GitHub):**
- Game metadata (title, year, publisher, description)
- Images (covers, screenshots)
- Validators (open-source algorithm)
- CRC checksums (anti-piracy verification)

❌ **What's never public:**
- User's API keys (~/.fiberquest/.env)
- User's custom games (local only)
- User's ROM paths
- Credentials

✅ **Rollback if needed:**
```bash
git -C ~/.fiberquest/games-db-repo checkout <old-commit>
```

## CI/CD for Games DB

Optional: GitHub Actions to validate games-db.json on push:

```yaml
# .github/workflows/validate-games-db.yml
name: Validate Games DB

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: node scripts/validate-games-db.js
        # Checks:
        # - Valid JSON
        # - All images exist
        # - CRC format
        # - Validator files exist
        # - No duplicates
```

---

## Summary

**GitHub repo (`fiberquest-games-db`):**
- Master copy of games metadata + images
- Updateable by you
- Public, anyone can fork/customize

**User's local (`~/.fiberquest/`):**
- Synced copy from GitHub
- User can override with custom games
- API keys/secrets stay local

**Daemon:**
- Pulls from GitHub on startup
- Merges GitHub + local custom games
- Serves unified API to Electron

**Result:** You update one repo, everyone's FiberQuest gets new games automatically. 🚀
