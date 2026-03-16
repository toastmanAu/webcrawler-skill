export type NetworkKind = "TESTNET" | "CUSTOM" | "DEVNET";

export interface RpcProfile {
  id: string;
  name: string;
  rpcUrl: string;
  indexerUrl?: string;
  kind: NetworkKind;
}

export interface ChainStatus {
  ok: boolean;
  latencyMs?: number;
  tipBlockNumber?: string;
  chain?: string;
  nodeVersion?: string;
  error?: string;
}

export interface StoredWallet {
  id: string;
  name: string;
  address: string;
  lockArg?: string;
  encryptedMnemonic?: string;
  encryptedPrivateKey?: string;
  createdAt: number;
}

export interface SessionWallet {
  id: string;
  name: string;
  address: string;
  privateKeyHex?: string;
  mnemonic?: string;
}

export interface RpcFavorite {
  id: string;
  label: string;
  method: string;
  params: string;
}

export interface TxDraft {
  toAddress: string;
  amountCkb: string;
  feeRate: string;
}