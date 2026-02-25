// Network Scanner Service
// Scans local /24 subnet for CKB nodes in parallel

import { probeNode, CKBNodeInfo } from './ckbRpc';

export type ScanProgress = {
  total: number;
  scanned: number;
  found: number;
  currentBatch: string[];
};

export type ScanCallback = (progress: ScanProgress, found: CKBNodeInfo[]) => void;

// Get the /24 subnet base from an IP like "192.168.68.87" → "192.168.68"
export function getSubnetBase(ip: string): string {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error('Invalid IP');
  return parts.slice(0, 3).join('.');
}

// Generate all IPs in a /24 subnet (1-254)
export function getSubnetIPs(base: string): string[] {
  const ips: string[] = [];
  for (let i = 1; i <= 254; i++) {
    ips.push(`${base}.${i}`);
  }
  return ips;
}

// Scan subnet in parallel batches
export async function scanSubnet(
  subnetBase: string,
  onProgress: ScanCallback,
  signal?: AbortSignal
): Promise<CKBNodeInfo[]> {
  const ips = getSubnetIPs(subnetBase);
  const found: CKBNodeInfo[] = [];
  const BATCH_SIZE = 30; // Probe 30 IPs at once
  let scanned = 0;

  for (let i = 0; i < ips.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;

    const batch = ips.slice(i, i + BATCH_SIZE);

    onProgress(
      {
        total: ips.length,
        scanned,
        found: found.length,
        currentBatch: batch,
      },
      [...found]
    );

    const results = await Promise.allSettled(
      batch.map((ip) => probeNode(ip))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value !== null) {
        found.push(result.value);
      }
    }

    scanned += batch.length;
  }

  onProgress(
    {
      total: ips.length,
      scanned,
      found: found.length,
      currentBatch: [],
    },
    [...found]
  );

  return found;
}
