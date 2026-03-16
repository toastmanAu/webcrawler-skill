import { create } from "zustand";
import type { RpcFavorite, RpcProfile, SessionWallet, StoredWallet } from "../types";
import {
  loadActiveNetworkId,
  loadFavorites,
  loadNetworks,
  loadWallets,
  saveActiveNetworkId,
  saveFavorites,
  saveNetworks,
  saveWallets
} from "../lib/storage";
import { randomId } from "../lib/utils";

const defaultTestnet: RpcProfile = {
  id: "default-testnet",
  name: "Nervos Testnet",
  rpcUrl: "https://testnet.ckb.dev/rpc",
  kind: "TESTNET"
};

interface AppState {
  networks: RpcProfile[];
  activeNetworkId: string;
  wallets: StoredWallet[];
  unlockedWallet?: SessionWallet;
  rpcFavorites: RpcFavorite[];

  setUnlockedWallet: (wallet?: SessionWallet) => void;
  upsertNetwork: (n: RpcProfile) => void;
  removeNetwork: (id: string) => void;
  setActiveNetwork: (id: string) => void;

  addWallet: (w: StoredWallet) => void;
  removeWallet: (id: string) => void;

  addFavorite: (f: RpcFavorite) => void;
  removeFavorite: (id: string) => void;
}

const initialNetworks = (() => {
  const loaded = loadNetworks();
  if (loaded.length) return loaded;
  saveNetworks([defaultTestnet]);
  return [defaultTestnet];
})();

const initialActive = loadActiveNetworkId() || initialNetworks[0].id;

export const useAppStore = create<AppState>((set) => ({
  networks: initialNetworks,
  activeNetworkId: initialActive,
  wallets: loadWallets(),
  unlockedWallet: undefined,
  rpcFavorites: loadFavorites(),

  setUnlockedWallet: (wallet) => set({ unlockedWallet: wallet }),

  upsertNetwork: (network) =>
    set((state) => {
      const exists = state.networks.some((n) => n.id === network.id);
      const next = exists
        ? state.networks.map((n) => (n.id === network.id ? network : n))
        : [...state.networks, { ...network, id: network.id || randomId() }];
      saveNetworks(next);
      return { networks: next };
    }),

  removeNetwork: (id) =>
    set((state) => {
      const next = state.networks.filter((n) => n.id !== id);
      saveNetworks(next);
      const fallback = next[0]?.id ?? "";
      if (state.activeNetworkId === id && fallback) {
        saveActiveNetworkId(fallback);
        return { networks: next, activeNetworkId: fallback };
      }
      return { networks: next };
    }),

  setActiveNetwork: (id) => {
    saveActiveNetworkId(id);
    set({ activeNetworkId: id });
  },

  addWallet: (wallet) =>
    set((state) => {
      const next = [...state.wallets, wallet];
      saveWallets(next);
      return { wallets: next };
    }),

  removeWallet: (id) =>
    set((state) => {
      const next = state.wallets.filter((w) => w.id !== id);
      saveWallets(next);
      return { wallets: next };
    }),

  addFavorite: (fav) =>
    set((state) => {
      const next = [...state.rpcFavorites, fav];
      saveFavorites(next);
      return { rpcFavorites: next };
    }),

  removeFavorite: (id) =>
    set((state) => {
      const next = state.rpcFavorites.filter((f) => f.id !== id);
      saveFavorites(next);
      return { rpcFavorites: next };
    })
}));