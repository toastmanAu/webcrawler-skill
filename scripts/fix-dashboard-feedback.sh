#!/bin/bash
# Fix dashboard feedback - add connection status indicators

ssh phill@192.168.68.79 << 'EOF'
cd ~/ram-viewer

# Update app.js with better feedback
cat > public/app.js << "JSFIX"
// RAM Viewer Dashboard Client with proper feedback
let ws = null;
let connected = false;
const logOutput = document.getElementById('logOutput');
const hostInput = document.getElementById('hostInput');
const portInput = document.getElementById('portInput');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusLight = document.getElementById('statusLight');
const statusText = document.getElementById('statusText');

// Create status elements if they don't exist
if (!statusLight) {
  const statusDiv = document.createElement('div');
  statusDiv.className = 'connection-status';
  statusDiv.innerHTML = `
    <div class="status-row">
      <div class="status-light" id="statusLight"></div>
      <span id="statusText">Not connected</span>
    </div>
  `;
  document.querySelector('.connection-form').appendChild(statusDiv);
}

// Connect WebSocket
function connectWebSocket() {
  if (ws) ws.close();
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = \`\${protocol}//\${window.location.host}\`;
  
  ws = new WebSocket(wsUrl);
  updateStatus('Connecting...', 'yellow');
  
  ws.onopen = () => {
    updateStatus('Connected to dashboard', 'green');
    addLog('WebSocket connected to server', 'success');
  };
  
  ws.onclose = () => {
    updateStatus('Dashboard disconnected', 'red');
    ws = null;
  };
  
  ws.onerror = (err) => {
    updateStatus('Connection error', 'red');
    addLog(\`WebSocket error: \${err.message}\`, 'error');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === 'log') {
        addLog(data.message, data.type);
      } else if (data.event === 'status') {
        updateStatus(data.message, data.type);
      } else if (data.event === 'connected') {
        connected = data.connected;
        updateStatus(data.connected ? 'Connected to RetroArch' : 'Disconnected', data.connected ? 'green' : 'red');
      }
    } catch (e) {
      addLog(\`Invalid message: \${e.message}\`, 'error');
    }
  };
}

// Update status indicator
function updateStatus(text, color) {
  const light = document.getElementById('statusLight');
  const textEl = document.getElementById('statusText');
  if (light) light.style.backgroundColor = color;
  if (textEl) textEl.textContent = text;
}

// Log helper
function addLog(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = \`log-entry log-\${type}\`;
  entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
  logOutput.appendChild(entry);
  logOutput.scrollTop = logOutput.scrollHeight;
}

// Connect to RetroArch
connectBtn.addEventListener('click', () => {
  const host = hostInput.value.trim();
  const port = parseInt(portInput.value);
  
  if (!host || !port) {
    addLog('Please enter valid IP and port', 'error');
    return;
  }
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog('Dashboard not connected. Reconnecting...', 'warn');
    connectWebSocket();
    setTimeout(() => sendConnect(host, port), 1000);
    return;
  }
  
  sendConnect(host, port);
});

function sendConnect(host, port) {
  addLog(\`Connecting to RetroArch at \${host}:\${port}\`, 'info');
  updateStatus('Connecting to RetroArch...', 'yellow');
  
  ws.send(JSON.stringify({
    action: 'connect',
    host: host,
    port: port
  }));
}

// Disconnect
disconnectBtn.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog('Not connected to dashboard', 'error');
    return;
  }
  
  addLog('Disconnecting from RetroArch', 'warn');
  updateStatus('Disconnecting...', 'yellow');
  ws.send(JSON.stringify({ action: 'disconnect' }));
});

// Game selection
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addLog('Connect to dashboard first', 'error');
      return;
    }
    
    const game = card.dataset.game;
    if (game === 'dkc' || game === 'smw') {
      addLog(\`Selected game: \${game}\`, 'info');
      ws.send(JSON.stringify({
        action: 'start',
        game: game,
        host: hostInput.value.trim(),
        port: parseInt(portInput.value)
      }));
    }
  });
});

// New game (discovery mode)
document.getElementById('newGameBtn').addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog('Connect to dashboard first', 'error');
    return;
  }
  
  addLog('Starting discovery mode', 'info');
  ws.send(JSON.stringify({
    action: 'discover',
    host: hostInput.value.trim(),
    port: parseInt(portInput.value)
  }));
});

// Initialize
connectWebSocket();
addLog('Dashboard initialized', 'info');
JSFIX

# Update CSS for status indicators
cat >> public/style.css << "CSSFIX"

/* Connection status indicator */
.connection-status {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: red;
}
#statusText {
  font-size: 14px;
  font-weight: 600;
}

/* Button states */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-connecting {
  background: #ff9800;
}
.btn-connected {
  background: #4caf50;
}

/* Log colors */
.log-connecting {
  color: #ff9800;
}
.log-connected {
  color: #4caf50;
}
.log-disconnected {
  color: #f44336;
}
CSSFIX

echo "✅ Dashboard feedback fixed!"
echo "🔄 Please refresh http://192.168.68.79:8767"
EOF