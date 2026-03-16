import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { Badge } from "../../components/Badge";
import { useAppStore } from "../../store/appStore";
import type { RpcProfile } from "../../types";
import { probeProfile } from "../../lib/rpc";
import { randomId } from "../../lib/utils";

export function NetworkPanel() {
  const { networks, activeNetworkId, setActiveNetwork, upsertNetwork, removeNetwork } = useAppStore();
  const active = useMemo(
    () => networks.find((n) => n.id === activeNetworkId) ?? networks[0],
    [networks, activeNetworkId]
  );

  const [draft, setDraft] = useState<RpcProfile>({
    id: "",
    name: "",
    rpcUrl: "",
    indexerUrl: "",
    kind: "CUSTOM"
  });

  const [status, setStatus] = useState<string>("Idle");

  useEffect(() => {
    if (!active) return;
    probeProfile(active).then((s) => {
      setStatus(
        s.ok
          ? `Connected · ${s.latencyMs}ms · tip ${s.tipBlockNumber} · ${s.nodeVersion}`
          : `Failed · ${s.error}`
      );
    });
  }, [active]);

  return (
    <Card title="Network & RPC">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {networks.map((n) => (
            <button
              key={n.id}
              className={`btn-secondary ${activeNetworkId === n.id ? "ring-1 ring-cyan-400" : ""}`}
              onClick={() => setActiveNetwork(n.id)}
            >
              {n.name} <span className="ml-2 text-xs text-slate-400">{n.kind}</span>
            </button>
          ))}
        </div>

        {active && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Badge>{active.kind}</Badge>
              <span className="text-sm text-slate-300">{active.rpcUrl}</span>
            </div>
            <p className="text-sm text-slate-400">{status}</p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Profile name">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Kind">
            <select
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value as RpcProfile["kind"] })}
            >
              <option value="TESTNET">TESTNET</option>
              <option value="CUSTOM">CUSTOM</option>
              <option value="DEVNET">DEVNET</option>
            </select>
          </Field>
          <Field label="RPC URL">
            <input
              value={draft.rpcUrl}
              onChange={(e) => setDraft({ ...draft, rpcUrl: e.target.value })}
              placeholder="https://testnet.ckb.dev/rpc"
            />
          </Field>
          <Field label="Indexer URL">
            <input
              value={draft.indexerUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, indexerUrl: e.target.value })}
              placeholder="Optional"
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              if (!draft.name || !draft.rpcUrl) return;
              upsertNetwork({ ...draft, id: draft.id || randomId() });
              setDraft({ id: "", name: "", rpcUrl: "", indexerUrl: "", kind: "CUSTOM" });
            }}
          >
            Save profile
          </button>
          {active && active.id !== "default-testnet" && (
            <button className="btn-danger" onClick={() => removeNetwork(active.id)}>
              Delete active
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}