// Stratum Proxy API Service
// Connects to stratum proxy running on port 8081

export interface MinerStats {
  id: string;
  name?: string;
  address?: string;
  hashrate: number;
  hashrateUnit: string;
  sharesAccepted: number;
  sharesRejected: number;
  lastSeen?: string;
  connected: boolean;
}

export interface StratumStats {
  node: string;
  nodeHealthy: boolean;
  connectedMiners: number;
  totalHashrate: number;
  totalHashrateUnit: string;
  miners: MinerStats[];
  uptime?: number;
  lastUpdated: Date;
  raw?: any;
}

// Normalize hashrate to a human-readable format
export function formatHashrate(hashrate: number, unit?: string): string {
  if (unit) return `${hashrate.toFixed(2)} ${unit}`;

  if (hashrate >= 1e15) return `${(hashrate / 1e15).toFixed(2)} PH/s`;
  if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`;
  if (hashrate >= 1e9) return `${(hashrate / 1e9).toFixed(2)} GH/s`;
  if (hashrate >= 1e6) return `${(hashrate / 1e6).toFixed(2)} MH/s`;
  if (hashrate >= 1e3) return `${(hashrate / 1e3).toFixed(2)} KH/s`;
  return `${hashrate.toFixed(2)} H/s`;
}

// Parse the stratum proxy JSON response
// The proxy may return different shapes depending on implementation
function parseStratumResponse(data: any): StratumStats {
  // Try to extract miners from various possible shapes
  let miners: MinerStats[] = [];

  // Shape 1: data.miners is an array
  if (Array.isArray(data.miners)) {
    miners = data.miners.map((m: any, idx: number) => ({
      id: m.id || m.worker_id || m.name || `miner-${idx}`,
      name: m.name || m.worker || m.worker_name,
      address: m.address || m.ip,
      hashrate: parseFloat(m.hashrate || m.hash_rate || 0),
      hashrateUnit: m.hashrate_unit || m.unit || 'H/s',
      sharesAccepted: parseInt(m.shares_accepted || m.accepted || 0),
      sharesRejected: parseInt(m.shares_rejected || m.rejected || 0),
      lastSeen: m.last_seen || m.lastSeen,
      connected: m.connected !== undefined ? m.connected : true,
    }));
  }

  // Shape 2: data.workers is an array
  if (Array.isArray(data.workers) && miners.length === 0) {
    miners = data.workers.map((m: any, idx: number) => ({
      id: m.id || m.name || `worker-${idx}`,
      name: m.name || m.worker,
      address: m.address || m.ip,
      hashrate: parseFloat(m.hashrate || 0),
      hashrateUnit: m.unit || 'H/s',
      sharesAccepted: parseInt(m.accepted || 0),
      sharesRejected: parseInt(m.rejected || 0),
      connected: true,
    }));
  }

  const totalHashrate =
    data.total_hashrate ||
    data.totalHashrate ||
    data.hashrate ||
    miners.reduce((sum, m) => sum + m.hashrate, 0);

  return {
    node: data.node || data.node_url || 'unknown',
    nodeHealthy: data.node_healthy ?? data.nodeHealthy ?? data.healthy ?? true,
    connectedMiners: data.connected_miners ?? data.connectedMiners ?? miners.filter((m) => m.connected).length,
    totalHashrate: parseFloat(totalHashrate) || 0,
    totalHashrateUnit: data.total_hashrate_unit || data.hashrateUnit || 'H/s',
    miners,
    uptime: data.uptime,
    lastUpdated: new Date(),
    raw: data,
  };
}

export async function fetchStratumStats(
  host: string,
  port: number = 8081,
  timeoutMs: number = 5000
): Promise<StratumStats> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`http://${host}:${port}/`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return parseStratumResponse(data);
  } finally {
    clearTimeout(timer);
  }
}
