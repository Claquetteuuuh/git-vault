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
  /** True while the working tree has local edits that haven't been committed+pushed. */
  dirty?: boolean;
  /** True if the last fetch noticed the remote branch had commits we don't have. */
  remoteAhead?: boolean;
  /** Last time we touched the remote (fetch or full sync). */
  lastFetchedAt?: number | null;
};

export type SyncState = 'idle' | 'pulling' | 'pushing' | 'error';

export type PendingConflict = {
  vaultId: string;
  originalPath: string;
  conflictPath: string;
  detectedAt: number;
};
