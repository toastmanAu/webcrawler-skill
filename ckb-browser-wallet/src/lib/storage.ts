import type { RpcFavorite, RpcProfile, StoredWallet } from "../types";

const KEYS = {
  networks: "ckb.wallet.networks",
  activeNetwork: "ckb.wallet.activeNetwork",
  wallets: "ckb.wallet.wallets",
  favorites: "ckb.wallet.rpcFavorites"
};

export function loadNetworks(): RpcProfile[] {
  const raw = localStorage.getItem(KEYS.networks);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveNetworks(items: RpcProfile[]) {
  localStorage.setItem(KEYS.networks, JSON.stringify(items));
}

export function loadActiveNetworkId(): string | null {
  return localStorage.getItem(KEYS.activeNetwork);
}

export function saveActiveNetworkId(id: string) {
  localStorage.setItem(KEYS.activeNetwork, id);
}

export function loadWallets(): StoredWallet[] {
  const raw = localStorage.getItem(KEYS.wallets);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveWallets(items: StoredWallet[]) {
  localStorage.setItem(KEYS.wallets, JSON.stringify(items));
}

export function loadFavorites(): RpcFavorite[] {
  const raw = localStorage.getItem(KEYS.favorites);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveFavorites(items: RpcFavorite[]) {
  localStorage.setItem(KEYS.favorites, JSON.stringify(items));
}