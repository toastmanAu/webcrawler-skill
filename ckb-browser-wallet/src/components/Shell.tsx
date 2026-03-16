import { PropsWithChildren } from "react";

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-2 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CKB Browser Wallet</h1>
            <p className="text-sm text-slate-400">
              Testnet-first browser wallet and CKB node control panel.
            </p>
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Testnet-first software. Do not trust with meaningful mainnet funds without review and audit.
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}