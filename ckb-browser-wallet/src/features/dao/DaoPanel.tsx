import { Card } from "../../components/Card";

export function DaoPanel() {
  return (
    <Card title="NervosDAO">
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          This panel is scaffolded for DAO deposit / prepare / withdraw flows.
        </p>
        <p className="text-slate-400">
          In a full build, wire CCC or compatible DAO helpers here and present:
          position discovery, stage/maturity status, deposit builder, prepare
          withdrawal transaction, and final withdrawal transaction.
        </p>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <div className="font-medium">Suggested implementation next</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">
            <li>Discover DAO cells for the unlocked address</li>
            <li>Render stage: deposited / prepared / withdrawable</li>
            <li>Construct safe action buttons gated by current stage</li>
            <li>Show epoch-based maturity details and estimated yield</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}