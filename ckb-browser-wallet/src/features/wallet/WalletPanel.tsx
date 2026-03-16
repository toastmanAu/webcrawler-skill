import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { useAppStore } from "../../store/appStore";
import { decryptText, encryptText } from "../../lib/security";
import { createWalletFromPrivateKey, generateWallet, importWalletFromMnemonic } from "../../lib/cccWallet";
import { randomId, shortHex } from "../../lib/utils";
import type { StoredWallet } from "../../types";

export function WalletPanel() {
  const { networks, activeNetworkId, wallets, addWallet, removeWallet, unlockedWallet, setUnlockedWallet } =
    useAppStore();
  const activeNetwork = useMemo(
    () => networks.find((n) => n.id === activeNetworkId)!,
    [networks, activeNetworkId]
  );

  const [password, setPassword] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [privKey, setPrivKey] = useState("");
  const [status, setStatus] = useState("");

  async function persistSessionWallet(input: Awaited<ReturnType<typeof generateWallet>>, name: string) {
    const stored: StoredWallet = {
      id: randomId(),
      name,
      address: input.address,
      encryptedMnemonic: input.mnemonic ? await encryptText(input.mnemonic, password) : undefined,
      encryptedPrivateKey: input.privateKeyHex ? await encryptText(input.privateKeyHex, password) : undefined,
      createdAt: Date.now()
    };
    addWallet(stored);
    setUnlockedWallet({
      id: stored.id,
      name: stored.name,
      address: stored.address,
      mnemonic: input.mnemonic,
      privateKeyHex: input.privateKeyHex
    });
  }

  return (
    <Card
      title="Wallets"
      right={
        unlockedWallet ? (
          <button className="btn-secondary" onClick={() => setUnlockedWallet(undefined)}>
            Lock
          </button>
        ) : null
      }
    >
      <div className="space-y-4">
        <Field label="Wallet password" hint="Used only to encrypt local browser storage.">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set or enter wallet password"
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            className="btn-primary"
            onClick={async () => {
              try {
                setStatus("Generating wallet...");
                const wallet = await generateWallet(activeNetwork);
                await persistSessionWallet(wallet, "Generated wallet");
                setStatus("Wallet generated and unlocked.");
              } catch (e) {
                setStatus(e instanceof Error ? e.message : "Failed.");
              }
            }}
            disabled={!password}
          >
            Create wallet
          </button>

          <button
            className="btn-secondary"
            onClick={async () => {
              try {
                setStatus("Importing mnemonic...");
                const wallet = await importWalletFromMnemonic(mnemonic, activeNetwork);
                await persistSessionWallet(wallet, "Mnemonic wallet");
                setMnemonic("");
                setStatus("Mnemonic wallet imported and unlocked.");
              } catch (e) {
                setStatus(e instanceof Error ? e.message : "Failed.");
              }
            }}
            disabled={!password || !mnemonic}
          >
            Import mnemonic
          </button>

          <button
            className="btn-secondary"
            onClick={async () => {
              try {
                setStatus("Importing private key...");
                const wallet = await createWalletFromPrivateKey(privKey, activeNetwork);
                await persistSessionWallet(wallet, "Private key wallet");
                setPrivKey("");
                setStatus("Private key wallet imported and unlocked.");
              } catch (e) {
                setStatus(e instanceof Error ? e.message : "Failed.");
              }
            }}
            disabled={!password || !privKey}
          >
            Import private key
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Mnemonic">
            <textarea
              rows={4}
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="twelve or twenty-four words"
            />
          </Field>
          <Field label="Private key" hint="High risk. Browser-only. Testnet strongly recommended.">
            <textarea
              rows={4}
              value={privKey}
              onChange={(e) => setPrivKey(e.target.value)}
              placeholder="0x..."
            />
          </Field>
        </div>

        {status && <p className="text-sm text-slate-400">{status}</p>}

        <div className="space-y-2">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium">{w.name}</div>
                <div className="text-xs text-slate-400 break-all">{w.address}</div>
                <div className="text-xs text-slate-500">
                  {new Date(w.createdAt).toLocaleString()} · {shortHex(w.id)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    try {
                      if (!password) {
                        setStatus("Enter password first.");
                        return;
                      }
                      const mnemonicPlain = w.encryptedMnemonic
                        ? await decryptText(w.encryptedMnemonic, password)
                        : undefined;
                      const pkPlain = w.encryptedPrivateKey
                        ? await decryptText(w.encryptedPrivateKey, password)
                        : undefined;

                      setUnlockedWallet({
                        id: w.id,
                        name: w.name,
                        address: w.address,
                        mnemonic: mnemonicPlain,
                        privateKeyHex: pkPlain
                      });
                      setStatus(`Unlocked ${w.name}.`);
                    } catch {
                      setStatus("Unlock failed. Wrong password or corrupted storage.");
                    }
                  }}
                >
                  Unlock
                </button>
                <button className="btn-danger" onClick={() => removeWallet(w.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {unlockedWallet && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            Unlocked: {unlockedWallet.name} · {unlockedWallet.address}
          </div>
        )}
      </div>
    </Card>
  );
}