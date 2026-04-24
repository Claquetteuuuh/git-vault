import { create } from 'zustand';

import { readJson, writeJson } from '@/lib/storage';
import type { Vault } from '@/lib/types';

const VAULTS_KEY = 'gitvault.vaults';

type VaultState = {
  vaults: Vault[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addVault: (vault: Vault) => Promise<void>;
  removeVault: (id: string) => Promise<void>;
  updateVault: (id: string, patch: Partial<Vault>) => Promise<void>;
  addDirtyPath: (vaultId: string, path: string) => Promise<void>;
  clearDirtyPaths: (vaultId: string) => Promise<void>;
  getVault: (id: string) => Vault | undefined;
};

export const useVaultStore = create<VaultState>((set, get) => ({
  vaults: [],
  hydrated: false,
  hydrate: async () => {
    const vaults = await readJson<Vault[]>(VAULTS_KEY, []);
    set({ vaults, hydrated: true });
  },
  addVault: async (vault) => {
    const next = [...get().vaults, vault];
    await writeJson(VAULTS_KEY, next);
    set({ vaults: next });
  },
  removeVault: async (id) => {
    const next = get().vaults.filter((v) => v.id !== id);
    await writeJson(VAULTS_KEY, next);
    set({ vaults: next });
  },
  updateVault: async (id, patch) => {
    const next = get().vaults.map((v) => (v.id === id ? { ...v, ...patch } : v));
    await writeJson(VAULTS_KEY, next);
    set({ vaults: next });
  },
  addDirtyPath: async (vaultId, path) => {
    const v = get().vaults.find((x) => x.id === vaultId);
    if (!v) return;
    const set_ = new Set(v.dirtyPaths ?? []);
    if (set_.has(path)) return; // already tracked — skip write
    set_.add(path);
    await get().updateVault(vaultId, { dirtyPaths: [...set_] });
  },
  clearDirtyPaths: async (vaultId) => {
    await get().updateVault(vaultId, { dirtyPaths: [] });
  },
  getVault: (id) => get().vaults.find((v) => v.id === id),
}));
