import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/Card";
import { useAppStore } from "../../store/appStore";
import { getBalanceCkb } from "../../lib/cccWallet";
import { copyText } from "../../lib/utils";

export function Dashboard() {
  const { networks, activeNetworkId, unlockedWallet } = useAppStore();
  const activeNetwork = useMemo(() => networks.find((n) => n.id === activeNetworkId)!, [networks, activeNetworkId]);

  const balanceQuery = useQuery({
    queryKey: ["balance", unlockedWallet?.address, activeNetwork.rpcUrl],
    queryFn: () => getBalanceCkb(unlockedWallet!.address, activeNetwork),
    enabled: !!unlockedWallet
  });

  return (
    <Card title="Dashboard">
      {!unlockedWallet ? (
        <p className="text-sm text-slate-400">Unlock a wallet to view balances and transact.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Address</div>
            <div className="mt-2 break-all text-sm">{unlockedWallet.address}</div>
            <button
              className="btn-secondary mt-3"
              onClick={() => copyText(unlockedWallet.address)}
            >
              Copy address
            </button>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Balance</div>
            <div className="mt-2 text-2xl font-semibold">
              {balanceQuery.isLoading ? "Loading..." : balanceQuery.data ?? "—"} CKB
            </div>
            {balanceQuery.error ? (
              <div className="mt-2 text-xs text-rose-400">
                {(balanceQuery.error as Error).message}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Network</div>
            <div className="mt-2 text-sm">{activeNetwork.name}</div>
            <div className="mt-1 text-xs text-slate-500 break-all">{activeNetwork.rpcUrl}</div>
          </div>
        </div>
      )}
    </Card>
  );
}