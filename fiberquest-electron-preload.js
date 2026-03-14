const { contextBridge, ipcMain } = require('electron');

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => {
    const os = require('os');
    return {
      platform: process.platform,
      arch: process.arch,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: process.uptime(),
    };
  },
  openDevTools: () => {
    require('electron').ipcRenderer.send('toggle-devtools');
  },
  invokeServiceInfo: () => {
    return require('electron').ipcRenderer.invoke('get-service-info');
  },
});

ipcMain.handle('get-service-info', async () => {
  const fs = require('fs').promises;
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const { stdout: pgStatus } = await execAsync('sudo systemctl is-active postgresql');
    const { stdout: websiteProc } = await execAsync('pgrep -f "npm run dev" | wc -l');

    return {
      postgresql: pgStatus.trim() === 'active' ? '✅ Running' : '❌ Stopped',
      website: parseInt(websiteProc) > 0 ? '✅ Running' : '❌ Stopped',
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (e) {
    return { error: e.message };
  }
});
