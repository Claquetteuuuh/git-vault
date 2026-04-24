export type GitHubUser = {
  login: string;
  name: string | null;
  avatarUrl: string | null;
};

export type Vault = {
  id: string;
  name: string;
  owner: string;
  repo: string;
  branch: string;
  cloneUrl: string;
  htmlUrl: string;
  localPath: string;
  addedAt: number;
  lastSyncedAt: number | null;
  /**
   * Paths (relative to the repo root) that have local edits since the last
   * successful commit+push. The sync flow commits only these paths, which
   * avoids the expensive `statusMatrix` walk over the whole working tree.
   * Derived `dirty` boolean is `dirtyPaths.length > 0`.
   */
  dirtyPaths?: string[];
  /** True if the last fetch noticed the remote branch had commits we don't have. */
  remoteAhead?: boolean;
  /** Last time we touched the remote (fetch or full sync). */
  lastFetchedAt?: number | null;
};

/** Convenience — `vault.dirty` used to be a boolean; derive it from dirtyPaths. */
export function isVaultDirty(v: Vault | undefined | null): boolean {
  return (v?.dirtyPaths?.length ?? 0) > 0;
}

export type SyncState = 'idle' | 'pulling' | 'pushing' | 'error';

export type PendingConflict = {
  vaultId: string;
  originalPath: string;
  conflictPath: string;
  detectedAt: number;
};
