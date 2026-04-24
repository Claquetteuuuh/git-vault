import { create } from 'zustand';

type SyncState = {
  activeVaultId: string | null;
  status: string;
  lastError: { vaultId: string; message: string } | null;
  lastConflicts: { vaultId: string; paths: string[] } | null;
  start: (vaultId: string) => void;
  setStatus: (label: string) => void;
  finish: (result: { vaultId: string; conflicts: string[] }) => void;
  fail: (vaultId: string, message: string) => void;
  clearError: () => void;
};

export const useSyncStore = create<SyncState>((set) => ({
  activeVaultId: null,
  status: '',
  lastError: null,
  lastConflicts: null,
  start: (vaultId) => set({ activeVaultId: vaultId, status: 'Starting…', lastError: null }),
  setStatus: (label) => set({ status: label }),
  finish: ({ vaultId, conflicts }) =>
    set((s) => ({
      activeVaultId: s.activeVaultId === vaultId ? null : s.activeVaultId,
      status: '',
      lastConflicts: conflicts.length > 0 ? { vaultId, paths: conflicts } : s.lastConflicts,
    })),
  fail: (vaultId, message) =>
    set((s) => ({
      activeVaultId: s.activeVaultId === vaultId ? null : s.activeVaultId,
      status: '',
      lastError: { vaultId, message },
    })),
  clearError: () => set({ lastError: null }),
}));
