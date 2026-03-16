import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { useAppStore } from "../../store/appStore";
import { prettyJson, randomId } from "../../lib/utils";
import { rpcCall } from "../../lib/rpc";

const commonMethods = [
  "get_tip_block_number",
  "get_blockchain_info",
  "local_node_info",
  "get_transaction",
  "get_block",
  "get_header",
  "get_live_cell",
  "dry_run_transaction",
  "send_transaction"
];

export function RpcExplorer() {
  const { networks, activeNetworkId, rpcFavorites, addFavorite, removeFavorite } = useAppStore();
  const activeNetwork = useMemo(() => networks.find((n) => n.id === activeNetworkId)!, [networks, activeNetworkId]);

  const [method, setMethod] = useState("get_tip_block_number");
  const [params, setParams] = useState("[]");
  const [response, setResponse] = useState("");
  const [label, setLabel] = useState("");

  async function execute() {
    try {
      const parsed = JSON.parse(params);
      const result = await rpcCall(activeNetwork, method, parsed);
      setResponse(prettyJson(result));
    } catch (e) {
      setResponse(prettyJson({ error: e instanceof Error ? e.message : "Unknown error" }));
    }
  }

  return (
    <Card title="RPC Explorer">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {commonMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Favorite label">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Tip block" />
        </Field>
        <Field label="Actions">
          <div className="flex gap-2">
            <button className="btn-primary w-full" onClick={execute}>
              Execute
            </button>
            <button
              className="btn-secondary w-full"
              onClick={() => {
                addFavorite({ id: randomId(), label: label || method, method, params });
                setLabel("");
              }}
            >
              Save
            </button>
          </div>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Params (JSON array)">
          <textarea rows={5} value={params} onChange={(e) => setParams(e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium text-slate-300">Saved favorites</div>
          <div className="space-y-2">
            {rpcFavorites.map((f) => (
              <div key={f.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="font-medium">{f.label}</div>
                <div className="text-xs text-slate-500">{f.method}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setMethod(f.method);
                      setParams(f.params);
                    }}
                  >
                    Load
                  </button>
                  <button className="btn-danger" onClick={() => removeFavorite(f.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-slate-300">Response</div>
          <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
            {response || "No response yet."}
          </pre>
        </div>
      </div>
    </Card>
  );
}