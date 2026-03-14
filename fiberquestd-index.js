const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.DAEMON_PORT || 3001;

// Load config
const configPath = process.env.CONFIG_FILE || './fiberquest.config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Database pool
const pool = new Pool(config.database);

// === REST API ===

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
    mode: 'daemon',
    retroarch: config.retroarch.path,
  });
});

// List tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tournaments');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get tournament details
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Register player for tournament
app.post('/api/tournaments/:id/join', async (req, res) => {
  try {
    // Check tournament exists
    const tourney = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [req.params.id]
    );

    if (!tourney.rows[0]) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Add entrant
    const result = await pool.query(
      'INSERT INTO entrants (tournament_id, joyid, ckb_address, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.body.joyid, req.body.ckbAddress, 'awaiting_payment']
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Validate game session (called by RetroArch RAM Viewer)
app.post('/api/validate', async (req, res) => {
  const { tournamentId, playerId, events } = req.body;

  try {
    // Load validator for game
    const tourney = await pool.query(
      'SELECT game_id FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    const gameId = tourney.rows[0].game_id;
    const validator = require(`../validator/dist/${gameId}-validator.js`);

    const result = validator.validate(events);

    // Store validation result
    await pool.query(
      'INSERT INTO validation_results (tournament_id, winner, cheating_detected, signature) VALUES ($1, $2, $3, $4)',
      [tournamentId, result.winner, !result.valid, result.signature]
    );

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// System info (RetroArch integration)
app.get('/api/system', (req, res) => {
  res.json({
    retroarch: {
      path: config.retroarch.path,
      udpPort: config.retroarch.udpPort,
      allowRemote: config.retroarch.allowRemote,
    },
    inference: config.inference,
    database: {
      connected: true,
      // Don't expose password
    },
  });
});

// === STARTUP ===
app.listen(PORT, () => {
  console.log(`🎮 FiberQuest Daemon listening on port ${PORT}`);
  console.log(`📂 RetroArch: ${config.retroarch.path}`);
  console.log(`🗄️  Database: ${config.database.database}`);
  console.log(`🔧 Config: ${configPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  pool.end();
  process.exit(0);
});
