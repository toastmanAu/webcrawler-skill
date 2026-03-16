import type { ChainStatus, RpcProfile } from "../types";

export async function rpcCall<T = unknown>(
  profile: RpcProfile,
  method: string,
  params: unknown[] = []
): Promise<T> {
  const res = await fetch(profile.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params
    })
  });

  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || "RPC error");
  }
  return json.result as T;
}

export async function probeProfile(profile: RpcProfile): Promise<ChainStatus> {
  const started = performance.now();
  try {
    const [tip, localNodeInfo] = await Promise.all([
      rpcCall<string>(profile, "get_tip_block_number", []),
      rpcCall<any>(profile, "local_node_info", [])
    ]);

    return {
      ok: true,
      latencyMs: Math.round(performance.now() - started),
      tipBlockNumber: tip,
      chain: localNodeInfo?.active ? "connected" : "unknown",
      nodeVersion: localNodeInfo?.version || "unknown"
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}