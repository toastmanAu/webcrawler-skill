import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { useAppStore } from "../../store/appStore";
import { sendCkb } from "../../lib/cccWallet";
import { copyText } from "../../lib/utils";

export function TransferPanel() {
  const { networks, activeNetworkId, unlockedWallet } = useAppStore();
  const activeNetwork = useMemo(() => networks.find((n) => n.id === activeNetworkId)!, [networks, activeNetworkId]);

  const [toAddress, setToAddress] = useState("");
  const [amountCkb, setAmountCkb] = useState("");
  const [feeRate, setFeeRate] = useState("1000");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  async function submit() {
    if (!unlockedWallet) {
      setStatus("Unlock a wallet first.");
      return;
    }
    try {
      setStatus("Building and sending transaction...");
      const hash = await sendCkb({
        network: activeNetwork,
        privateKeyHex: unlockedWallet.privateKeyHex,
        mnemonic: unlockedWallet.mnemonic,
        toAddress,
        amountCkb,
        feeRate
      });
      setTxHash(hash);
      setStatus("Transaction submitted.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Transfer failed.");
    }
  }

  return (
    <Card title="Transfer CKB">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="To address">
          <input value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="ckt1..." />
        </Field>
        <Field label="Amount (CKB)">
          <input value={amountCkb} onChange={(e) => setAmountCkb(e.target.value)} placeholder="123.45" />
        </Field>
        <Field label="Fee rate">
          <input value={feeRate} onChange={(e) => setFeeRate(e.target.value)} placeholder="1000" />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={submit} disabled={!unlockedWallet}>
          Send
        </button>
      </div>

      {status && <p className="mt-3 text-sm text-slate-400">{status}</p>}

      {txHash && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Transaction hash</div>
          <div className="mt-2 break-all text-sm">{txHash}</div>
          <button className="btn-secondary mt-3" onClick={() => copyText(txHash)}>
            Copy tx hash
          </button>
        </div>
      )}
    </Card>
  );
}