import { Shell } from "./components/Shell";
import { NetworkPanel } from "./features/networks/NetworkPanel";
import { WalletPanel } from "./features/wallet/WalletPanel";
import { Dashboard } from "./features/dashboard/Dashboard";
import { TransferPanel } from "./features/transfer/TransferPanel";
import { RpcExplorer } from "./features/rpc/RpcExplorer";
import { DaoPanel } from "./features/dao/DaoPanel";
import { ToolsPanel } from "./features/tools/ToolsPanel";

export default function App() {
  return (
    <Shell>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <NetworkPanel />
          <WalletPanel />
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Dashboard />
          <TransferPanel />
          <RpcExplorer />
          <DaoPanel />
          <ToolsPanel />
        </div>
      </div>
    </Shell>
  );
}