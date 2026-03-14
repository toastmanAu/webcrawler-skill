#!/bin/bash
# Quick fix for dashboard feedback - simpler approach

echo "Fixing dashboard feedback..."

ssh phill@192.168.68.79 << 'SSH_EOF'
cd ~/ram-viewer

# First, let's check what the server.js actually logs
echo "=== Checking server logs ==="
tail -5 dashboard.log 2>/dev/null || echo "No dashboard.log"

# Update app.js with the correct message format
cat > public/app.js << 'JS_EOF'
// RAM Viewer Dashboard - Simple working version
console.log('Dashboard loading...');
let ws = null;
const logOutput = document.getElementById('logOutput');

function addLog(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = 'log-entry log-' + type;
  div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  logOutput.appendChild(div);
  logOutput.scrollTop = logOutput.scrollHeight;
}

function connectWS() {
  if (ws) ws.close();
  const url = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host;
  ws = new WebSocket(url);
  
  ws.onopen = () => {
    addLog('Connected to dashboard server', 'success');
    document.getElementById('connectBtn').disabled = false;
    document.getElementById('disconnectBtn').disabled = false;
  };
  
  ws.onclose = () => {
    addLog('Dashboard disconnected', 'error');
    ws = null;
  };
  
  ws.onerror = (err) => addLog('WebSocket error: ' + err.message, 'error');
  
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log('WS message:', data);
      
      if (data.event === 'log') {
        addLog(data.message, data.type);
      } else if (data.event === 'test') {
        if (data.success) {
          addLog('✓ RetroArch connected: ' + data.response, 'success');
        } else {
          addLog('✗ RetroArch failed: ' + data.error, 'error');
        }
      } else if (data.event === 'started') {
        addLog('Game polling started', 'success');
      } else if (data.event === 'stopped') {
        addLog('Game polling stopped', 'warn');
      } else if (data.event === 'games') {
        addLog('Games available: ' + data.games.join(', '), 'info');
      }
    } catch (err) {
      addLog('Bad message: ' + err.message, 'error');
    }
  };
}

// Connect button
document.getElementById('connectBtn').addEventListener('click', () => {
  const host = document.getElementById('hostInput').value.trim();
  const port = parseInt(document.getElementById('portInput').value);
  
  if (!host || !port) {
    addLog('Enter IP and port', 'error');
    return;
  }
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog('Connecting to dashboard...', 'info');
    connectWS();
    setTimeout(() => sendTest(host, port), 500);
    return;
  }
  
  sendTest(host, port);
});

function sendTest(host, port) {
  addLog('Testing RetroArch at ' + host + ':' + port, 'info');
  ws.send(JSON.stringify({
    type: 'test',
    host: host,
    port: port
  }));
}

// Disconnect button  
document.getElementById('disconnectBtn').addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog('Not connected', 'error');
    return;
  }
  ws.send(JSON.stringify({ type: 'stop' }));
});

// Game buttons
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const game = card.dataset.game;
    const host = document.getElementById('hostInput').value.trim();
    const port = parseInt(document.getElementById('portInput').value);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addLog('Connect first', 'error');
      return;
    }
    
    if (game === 'dkc' || game === 'smw') {
      addLog('Starting ' + game + '...', 'info');
      ws.send(JSON.stringify({
        type: 'start',
        game: game,
        host: host,
        port: port,
        interval: 500
      }));
    } else if (card.id === 'newGameBtn') {
      addLog('Discovery mode - sending RAM read...', 'info');
      ws.send(JSON.stringify({
        type: 'command',
        command: 'READ_CORE_RAM 0x0000 16',
        host: host,
        port: port
      }));
    }
  });
});

// Auto-connect on load
setTimeout(connectWS, 100);
addLog('Ready. Enter RetroArch IP (192.168.68.73) and click Connect.', 'info');
JS_EOF

echo "✅ Dashboard client updated!"
echo "🔄 Refresh the page"
SSH_EOF

echo "Done! Please refresh http://192.168.68.79:8767"