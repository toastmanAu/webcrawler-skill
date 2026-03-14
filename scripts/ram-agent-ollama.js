#!/usr/bin/env node
/**
 * RAM Agent — Minimal Ollama inference for RetroArch RAM watching
 * 
 * Ultra-lightweight agent that:
 * 1. Polls RetroArch UDP for RAM values
 * 2. Sends batches to Ollama (tiny model like qwen2.5:3b)
 * 3. Forwards events to central dashboard via HTTP
 * 
 * Inference workload: 10-20 addresses, batch every 5s, ~100 tokens/batch
 */

'use strict';

const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

// ── Configuration ──────────────────────────────────────────────
const CONFIG = (() => {
  const configPath = path.join(process.env.HOME || '/tmp', '.ram-viewer/config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  // Defaults
  return {
    retroarch: { host: '127.0.0.1', port: 55355 },
    ollama: { url: 'http://localhost:11434', model: 'qwen2.5:3b' },
    dashboard: { url: 'http://localhost:8766' },
    game: 'discover',
    pollInterval: 500,
    llmInterval: 5000
  };
})();

const RA_HOST = process.env.RA_HOST || CONFIG.retroarch.host;
const RA_PORT = parseInt(process.env.RA_PORT || CONFIG.retroarch.port);
const OLLAMA_URL = process.env.OLLAMA_URL || CONFIG.ollama.url;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || CONFIG.ollama.model;
const DASHBOARD_URL = process.env.DASHBOARD_URL || CONFIG.dashboard.url;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || CONFIG.pollInterval);
const LLM_INTERVAL = parseInt(process.env.LLM_INTERVAL || CONFIG.llmInterval);

// ── Game addresses (example for DK Country) ────────────────────
// In discovery mode, we'd scan addresses 0x0000-0x1FFF (8KB)
const GAME_ADDRESSES = {
  'dkc': [
    { addr: '0x0000', label: 'Lives', size: 1, format: 'uint8' },
    { addr: '0x0001', label: 'Score', size: 3, format: 'bcd' },
    { addr: '0x0004', label: 'Time', size: 2, format: 'uint16' },
    { addr: '0x0006', label: 'World', size: 1, format: 'uint8' },
    { addr: '0x0007', label: 'Level', size: 1, format: 'uint8' }
  ],
  'discover': [
    // Will be populated by discovery scan
    { addr: '0x0000', label: 'Scan-0x0000', size: 1 },
    { addr: '0x0001', label: 'Scan-0x0001', size: 1 },
    { addr: '0x0002', label: 'Scan-0x0002', size: 1 },
    { addr: '0x0003', label: 'Scan-0x0003', size: 1 },
    { addr: '0x0004', label: 'Scan-0x0004', size: 1 }
  ]
};

// ── State ──────────────────────────────────────────────────────
const udpClient = dgram.createSocket('udp4');
let valuesHistory = [];
let lastInferenceTime = 0;
const addressValues = new Map();

// ── Helper: send UDP command ───────────────────────────────────
function sendUdp(command) {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(command + '\n');
    udpClient.send(buffer, RA_PORT, RA_HOST, (err) => {
      if (err) return reject(err);
      
      const timer = setTimeout(() => {
        udpClient.removeListener('message', onMessage);
        reject(new Error('UDP timeout'));
      }, 2000);
      
      const onMessage = (msg, rinfo) => {
        if (rinfo.address === RA_HOST && rinfo.port === RA_PORT) {
          clearTimeout(timer);
          udpClient.removeListener('message', onMessage);
          resolve(msg.toString().trim());
        }
      };
      
      udpClient.on('message', onMessage);
    });
  });
}

// ── Helper: read RAM at address ────────────────────────────────
async function readRam(addrHex) {
  try {
    const cmd = `READ_CORE_RAM ${addrHex}`;
    const response = await sendUdp(cmd);
    // Response format: "READ_CORE_RAM <addr> <value>"
    const parts = response.split(' ');
    if (parts.length >= 3) {
      return parseInt(parts[2], 16);
    }
  } catch (err) {
    console.error(`[UDP] ${addrHex}: ${err.message}`);
  }
  return null;
}

// ── Helper: send to Ollama for pattern analysis ────────────────
async function inferPatterns(valuesBatch) {
  // Minimal prompt for tiny model
  const prompt = `Analyze these game RAM values over time. Respond with JSON array of events found.
Values: ${JSON.stringify(valuesBatch)}
Events to detect: sudden jump (>50), steady increase, steady decrease, value crossed threshold.
Format: [{"type": "jump|increase|decrease|threshold", "address": "0x1234", "value": 42, "description": "brief note"}]`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 100  // Tiny response
        }
      })
    });
    
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = await response.json();
    
    // Parse JSON from response
    const jsonMatch = data.response.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (err) {
    console.error(`[Ollama] Inference failed: ${err.message}`);
    return [];
  }
}

// ── Helper: forward event to dashboard ─────────────────────────
async function forwardEvent(event) {
  try {
    await fetch(`${DASHBOARD_URL}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ram-event',
        timestamp: new Date().toISOString(),
        ...event
      })
    });
  } catch (err) {
    // Silent fail - dashboard might not be up yet
  }
}

// ── Main polling loop ──────────────────────────────────────────
async function pollLoop() {
  const addresses = GAME_ADDRESSES[CONFIG.game] || GAME_ADDRESSES.discover;
  const now = Date.now();
  
  // Poll all addresses
  for (const addr of addresses) {
    const value = await readRam(addr.addr);
    if (value !== null) {
      addressValues.set(addr.addr, value);
    }
  }
  
  // Add to history
  valuesHistory.push({
    timestamp: now,
    values: Object.fromEntries(addressValues)
  });
  
  // Keep last 10 readings
  if (valuesHistory.length > 10) {
    valuesHistory = valuesHistory.slice(-10);
  }
  
  // Run inference every LLM_INTERVAL ms
  if (now - lastInferenceTime > LLM_INTERVAL && valuesHistory.length >= 5) {
    console.log(`[Inference] Sending ${valuesHistory.length} samples to ${OLLAMA_MODEL}`);
    
    const events = await inferPatterns(valuesHistory);
    lastInferenceTime = now;
    
    // Forward events to dashboard
    for (const event of events) {
      console.log(`[Event] ${event.type} at ${event.address}: ${event.description}`);
      await forwardEvent(event);
    }
    
    // Clear history after inference
    if (events.length > 0) {
      valuesHistory = valuesHistory.slice(-2); // Keep last 2 for continuity
    }
  }
}

// ── Discovery mode ─────────────────────────────────────────────
async function discoveryScan() {
  console.log(`[Discovery] Scanning ${RA_HOST}:${RA_PORT} for RAM patterns...`);
  
  // Quick scan of first 32 bytes
  const candidates = [];
  for (let i = 0; i < 32; i++) {
    const addr = `0x${i.toString(16).padStart(4, '0')}`;
    const value = await readRam(addr);
    if (value !== null) {
      candidates.push({ addr, value });
    }
  }
  
  console.log(`[Discovery] Found ${candidates.length} readable addresses`);
  return candidates.slice(0, 5); // Top 5 for monitoring
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log(`
╔══════════════════════════════════════════╗
║   RAM Agent (Ollama inference)          ║
╚══════════════════════════════════════════╝
  RetroArch: ${RA_HOST}:${RA_PORT}
  Ollama: ${OLLAMA_URL} (${OLLAMA_MODEL})
  Dashboard: ${DASHBOARD_URL}
  Mode: ${CONFIG.game}
  `);
  
  // Discovery mode
  if (CONFIG.game === 'discover') {
    console.log('[Discovery] Starting discovery mode...');
    const discovered = await discoveryScan();
    if (discovered.length > 0) {
      console.log(`[Discovery] Will monitor: ${discovered.map(d => d.addr).join(', ')}`);
    }
  }
  
  // Start polling loop
  console.log(`[Polling] Starting at ${POLL_INTERVAL}ms intervals`);
  setInterval(pollLoop, POLL_INTERVAL);
  
  // Initial poll
  pollLoop().catch(err => console.error(`[Poll] Initial error: ${err.message}`));
}

// Handle exit
process.on('SIGINT', () => {
  console.log('\n[Shutdown] RAM Agent stopping...');
  udpClient.close();
  process.exit(0);
});

// Start
main().catch(err => {
  console.error(`[Fatal] ${err.message}`);
  process.exit(1);
});