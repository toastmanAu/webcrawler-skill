import { ccc } from "@ckb-ccc/core";
import * as bip39 from "bip39";
import type { RpcProfile, SessionWallet } from "../types";
import { ckbFromShannons, shannonsFromCkb } from "./utils";

/**
 * CCC Wallet Adapter for Nervos CKB browser wallet.
 * Uses CCC 1.3.0 API.
 */

export async function createWalletFromPrivateKey(
  privateKeyHex: string,
  network: RpcProfile
): Promise<SessionWallet> {
  const client = new ccc.ClientPublicTestnet({
    url: network.rpcUrl,
  });

  const signer = new ccc.SignerCkbPrivateKey(client, privateKeyHex);
  const address = await signer.getRecommendedAddress();

  return {
    id: crypto.randomUUID(),
    name: "Imported wallet",
    address: address.toString(),
    privateKeyHex,
  };
}

export async function generateWallet(network: RpcProfile): Promise<SessionWallet> {
  const mnemonic = bip39.generateMnemonic();
  return importWalletFromMnemonic(mnemonic, network);
}

export async function importWalletFromMnemonic(
  mnemonic: string,
  network: RpcProfile
): Promise<SessionWallet> {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  // Use first 32 bytes of seed as private key for secp256k1
  const privateKeyHex = seed.slice(0, 32).toString("hex");

  const client = new ccc.ClientPublicTestnet({
    url: network.rpcUrl,
  });

  const signer = new ccc.SignerCkbPrivateKey(client, privateKeyHex);
  const address = await signer.getRecommendedAddress();

  return {
    id: crypto.randomUUID(),
    name: "Mnemonic wallet",
    address: address.toString(),
    mnemonic,
  };
}

export async function getBalanceShannons(
  address: string,
  network: RpcProfile
): Promise<string> {
  const client = new ccc.ClientPublicTestnet({
    url: network.rpcUrl,
  });

  const addr = new ccc.Address(address);
  const key = ccc.ClientIndexerSearchKey.from({ 
    script: addr.script, 
    scriptType: "lock",
    scriptSearchMode: "prefix"
  });
  const cells = client.findCells(key, "asc");
  let total = 0n;
  for await (const cell of cells) {
    total += BigInt(cell.cellOutput.capacity);
  }
  return total.toString();
}

export async function getBalanceCkb(address: string, network: RpcProfile): Promise<string> {
  const shannons = await getBalanceShannons(address, network);
  return ckbFromShannons(shannons);
}

export async function sendCkb(params: {
  network: RpcProfile;
  privateKeyHex?: string;
  mnemonic?: string;
  toAddress: string;
  amountCkb: string;
  feeRate: string;
}): Promise<string> {
  const client = new ccc.ClientPublicTestnet({
    url: params.network.rpcUrl,
  });

  let privateKeyHex = params.privateKeyHex;
  if (params.mnemonic) {
    const seed = await bip39.mnemonicToSeed(params.mnemonic);
    privateKeyHex = seed.slice(0, 32).toString("hex");
  }

  if (!privateKeyHex) {
    throw new Error("Wallet is locked or missing signing material.");
  }

  const signer = new ccc.SignerCkbPrivateKey(client, privateKeyHex);
  const to = new ccc.Address(params.toAddress);
  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: to.script,
        capacity: ccc.fixedPointFrom(params.amountCkb),
      },
    ],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, Number(params.feeRate || "1000"));
  const txHash = await signer.sendTransaction(tx);

  return txHash;
}