// CKB RPC Service
// Communicates with CKB full nodes via JSON-RPC on port 8114

export interface CKBNodeInfo {
  ip: string;
  port: number;
  blockNumber: number;
  peerCount: number;
  nodeId?: string;
  chain?: string;
  isIBD?: boolean;  // Initial Block Download
  epoch?: string;
  reachable: boolean;
  lastSeen: Date;
  latencyMs?: number;
}

const RPC_PORT = 8114;
const RPC_TIMEOUT = 3000; // 3 seconds for scanning

async function rpcCall(
  ip: string,
  method: string,
  params: any[] = [],
  timeoutMs: number = RPC_TIMEOUT
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`http://${ip}:${RPC_PORT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method,
        params,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }

    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

export async function getBlockNumber(ip: string, timeoutMs?: number): Promise<number | null> {
  try {
    const result = await rpcCall(ip, 'get_tip_block_number', [], timeoutMs);
    if (result && typeof result === 'string') {
      return parseInt(result, 16);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getLocalNodeInfo(ip: string, timeoutMs?: number): Promise<{ peerCount: number; nodeId: string } | null> {
  try {
    const result = await rpcCall(ip, 'local_node_info', [], timeoutMs);
    if (result) {
      return {
        peerCount: result.connections ? parseInt(result.connections, 16) : 0,
        nodeId: result.node_id || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getBlockchainInfo(ip: string, timeoutMs?: number): Promise<{
  chain: string;
  epoch: string;
  isIBD: boolean;
  tipHash: string;
} | null> {
  try {
    const result = await rpcCall(ip, 'get_blockchain_info', [], timeoutMs);
    if (result) {
      return {
        chain: result.chain || 'unknown',
        epoch: result.epoch || '0x0',
        isIBD: result.is_initial_block_download || false,
        tipHash: result.tip_hash || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function probeNode(ip: string): Promise<CKBNodeInfo | null> {
  const start = Date.now();
  const blockNumber = await getBlockNumber(ip, RPC_TIMEOUT);

  if (blockNumber === null) {
    return null;
  }

  const latencyMs = Date.now() - start;

  // Node is reachable, get more info
  const [nodeInfo, chainInfo] = await Promise.allSettled([
    getLocalNodeInfo(ip, 2000),
    getBlockchainInfo(ip, 2000),
  ]);

  const nodeData = nodeInfo.status === 'fulfilled' ? nodeInfo.value : null;
  const chainData = chainInfo.status === 'fulfilled' ? chainInfo.value : null;

  return {
    ip,
    port: RPC_PORT,
    blockNumber,
    peerCount: nodeData?.peerCount ?? 0,
    nodeId: nodeData?.nodeId,
    chain: chainData?.chain,
    isIBD: chainData?.isIBD,
    epoch: chainData?.epoch,
    reachable: true,
    lastSeen: new Date(),
    latencyMs,
  };
}

export async function getNodeDetails(ip: string): Promise<CKBNodeInfo | null> {
  return probeNode(ip);
}

// Parse epoch number from hex epoch string
export function parseEpoch(epochHex: string): { number: number; index: number; length: number } {
  // Epoch is packed: bits 0-23 = index, bits 24-47 = length, bits 48-63 = number
  const epoch = BigInt(epochHex);
  const number = Number((epoch >> BigInt(54)) & BigInt(0xffff));
  const index = Number((epoch >> BigInt(0)) & BigInt(0xffffff));
  const length = Number((epoch >> BigInt(24)) & BigInt(0xffffff));
  return { number, index, length };
}
