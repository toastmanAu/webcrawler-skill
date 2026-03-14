#!/bin/bash
# FiberQuest Setup — Local Games Database Configuration
# Runs as part of installer to set up user's local games-db

set -e

CONFIG_HOME="${HOME}/.fiberquest"
GAMES_DB="${CONFIG_HOME}/games-db.json"
GAMESDB_API_KEY="${THEGAMESDB_API_KEY:-}"

mkdir -p "$CONFIG_HOME"/{cache,logs}

echo "📚 Setting up Games Database..."
echo ""

# === STEP 1: Detect TheGamesDB API Key ===
if [ -z "$GAMESDB_API_KEY" ]; then
  echo "🔑 TheGamesDB API Key not found."
  echo ""
  echo "Get one free at: https://thegamesdb.net/user/register"
  echo "Then set: export THEGAMESDB_API_KEY='your-key-here'"
  echo ""
  read -p "Enter your TheGamesDB API key (optional, press Enter to skip): " GAMESDB_API_KEY
fi

# === STEP 2: Create .env for FiberQuest ===
cat > "${CONFIG_HOME}/.env" << ENV
# FiberQuest Local Configuration
# This file is NOT version-controlled
# Keep your API keys here

THEGAMESDB_API_KEY="${GAMESDB_API_KEY}"
IGDB_CLIENT_ID=""
IGDB_ACCESS_TOKEN=""

# Optional: Customize game database location
GAMES_DB_PATH="${GAMES_DB}"

# Optional: Override cache directory
CACHE_DIR="${CONFIG_HOME}/cache"
ENV

chmod 600 "${CONFIG_HOME}/.env"
echo "✅ Created: ${CONFIG_HOME}/.env (secrets kept local)"

# === STEP 3: Initialize Games Database ===
if [ ! -f "$GAMES_DB" ]; then
  echo ""
  echo "📥 Downloading initial games database..."
  
  # Stub database (user can populate via API or manually)
  cat > "$GAMES_DB" << 'GAMESDB'
{
  "version": "1.0.0",
  "lastUpdated": null,
  "games": [
    {
      "id": "pokefr",
      "title": "Pokémon Fire Red",
      "system": "gba",
      "year": 2004,
      "publisher": "Nintendo",
      "description": "Classic Pokémon adventure on Game Boy Advance",
      "image": null,
      "validCRCs": ["12345abc", "67890def"],
      "validator": "pokefr-validator.js",
      "retroarchCore": "mgba_libretro.so",
      "expectedExtensions": [".gba", ".zip"],
      "maxPlayers": 1,
      "tournament": {
        "type": "speedrun",
        "objective": "Complete game in under 3 hours",
        "scoringMethod": "completion_time"
      }
    },
    {
      "id": "mk2",
      "title": "Mortal Kombat II",
      "system": "snes",
      "year": 1993,
      "publisher": "Acclaim",
      "description": "Classic 1v1 fighting game",
      "image": null,
      "validCRCs": ["abcd1234", "efgh5678"],
      "validator": "mk2-validator.js",
      "retroarchCore": "snes9x_libretro.so",
      "expectedExtensions": [".smc", ".zip"],
      "maxPlayers": 2,
      "tournament": {
        "type": "vs",
        "objective": "1v1 match, win by KO",
        "scoringMethod": "win_count"
      }
    },
    {
      "id": "mk64",
      "title": "Mario Kart 64",
      "system": "n64",
      "year": 1996,
      "publisher": "Nintendo",
      "description": "Racing game on Nintendo 64",
      "image": null,
      "validCRCs": ["aaaa1111", "bbbb2222"],
      "validator": "mk64-validator.js",
      "retroarchCore": "mupen64plus_libretro.so",
      "expectedExtensions": [".z64", ".n64", ".zip"],
      "maxPlayers": 4,
      "tournament": {
        "type": "race",
        "objective": "3 laps, fastest time wins",
        "scoringMethod": "race_time"
      }
    }
  ]
}
GAMESDB

  echo "✅ Created: $GAMES_DB"
else
  echo "✅ Games database already exists: $GAMES_DB"
fi

# === STEP 4: Create Update Script ===
cat > "${CONFIG_HOME}/update-games-db.sh" << 'UPDATE_SCRIPT'
#!/bin/bash
# Refresh games database from TheGamesDB API
# Usage: bash ~/.fiberquest/update-games-db.sh

source ~/.fiberquest/.env

GAMES_DB="${GAMES_DB_PATH:-$HOME/.fiberquest/games-db.json}"
API_KEY="${THEGAMESDB_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "❌ THEGAMESDB_API_KEY not set in ~/.fiberquest/.env"
  exit 1
fi

echo "🔄 Updating games database from TheGamesDB..."

# Example: Fetch Pokémon Fire Red metadata
curl -s "https://thegamesdb.net/api/v1/Games?name=Pokemon%20Fire%20Red&apikey=${API_KEY}" \
  | jq . > /tmp/gamesdb-response.json

echo "✅ Response saved to /tmp/gamesdb-response.json"
echo "📝 Manually merge results into $GAMES_DB"
UPDATE_SCRIPT

chmod +x "${CONFIG_HOME}/update-games-db.sh"
echo "✅ Created: ${CONFIG_HOME}/update-games-db.sh (manual API refresh)"

# === STEP 5: Instructions ===
echo ""
echo "═════════════════════════════════════════════"
echo "Games Database Setup Complete"
echo "═════════════════════════════════════════════"
echo ""
echo "📂 Configuration Home: ${CONFIG_HOME}"
echo "📝 Secrets File:       ${CONFIG_HOME}/.env"
echo "📚 Games DB:           ${GAMES_DB}"
echo "🔄 Update Script:      ${CONFIG_HOME}/update-games-db.sh"
echo ""
echo "📋 Next Steps:"
echo "1. Edit ~/.fiberquest/.env to add API keys"
echo "2. Customize games-db.json with your games"
echo "3. Add CRCs for each game version you have"
echo "4. Copy ROMs to ~/fiberquest/games/{system}/"
echo ""
echo "💡 Tips:"
echo "- games-db.json is NOT version-controlled"
echo "- .env keeps secrets local (gitignore)"
echo "- Run update-games-db.sh to refresh metadata"
echo "- Add custom games to games-db.json manually"
echo ""
