import { fetchVault, syncVault, type SyncResult } from '@/lib/sync';
import { useAuthStore } from '@/store/auth';
import { useSyncStore } from '@/store/sync';
import { useVaultStore } from '@/store/vaults';

const inFlight = new Map<string, Promise<SyncResult | null>>();
const fetchInFlight = new Map<string, Promise<{ remoteAhead: boolean } | null>>();

// Ambient fetches (vault open) are throttled so a user bouncing between
// screens doesn't re-hit GitHub every time.
const MIN_FETCH_INTERVAL_MS = 60 * 1000;

export type RunSyncOptions = {
  /** Bypass throttle interval — for user-initiated syncs. */
  force?: boolean;
};

/**
 * Full sync: commit local changes (if dirty), fetch, merge divergence if any,
 * push if we're ahead of origin. Expensive. User-initiated only.
 */
export function runSync(vaultId: string, opts: RunSyncOptions = {}): Promise<SyncResult | null> {
  const existing = inFlight.get(vaultId);
  if (existing) return existing;

  const vault = useVaultStore.getState().getVault(vaultId);
  if (!vault) return Promise.resolve(null);

  const promise = (async (): Promise<SyncResult | null> => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return null;

    const { start, setStatus, finish, fail } = useSyncStore.getState();
    start(vaultId);
    try {
      // Snapshot the dirty paths at sync-start. If the user edits again mid-sync,
      // those edits stay queued for the next sync (won't be lost).
      const dirtyPaths = [...(vault.dirtyPaths ?? [])];
      const result = await syncVault(
        vault,
        { token },
        user,
        (label) => setStatus(label),
        { dirtyPaths },
      );
      // Successful sync: mark remote state + clear the paths we just committed.
      await useVaultStore.getState().updateVault(vaultId, {
        lastSyncedAt: Date.now(),
        lastFetchedAt: Date.now(),
        remoteAhead: false,
        // Only clear the paths that were in this sync's snapshot — preserves
        // any new edits that happened during the sync itself.
        dirtyPaths: (useVaultStore.getState().getVault(vaultId)?.dirtyPaths ?? []).filter(
          (p) => !dirtyPaths.includes(p),
        ),
      });
      finish({ vaultId, conflicts: result.conflicts });
      return result;
    } catch (err) {
      fail(vaultId, err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      inFlight.delete(vaultId);
    }
  })();

  inFlight.set(vaultId, promise);
  return promise;
}

/**
 * Lightweight fetch-only check. Call on vault open; it tells the UI whether
 * the sync button should flash a "pull available" dot.
 */
export function runFetch(
  vaultId: string,
  opts: RunSyncOptions = {},
): Promise<{ remoteAhead: boolean } | null> {
  const existing = fetchInFlight.get(vaultId);
  if (existing) return existing;

  const vault = useVaultStore.getState().getVault(vaultId);
  if (!vault) return Promise.resolve(null);

  if (
    !opts.force &&
    vault.lastFetchedAt &&
    Date.now() - vault.lastFetchedAt < MIN_FETCH_INTERVAL_MS
  ) {
    return Promise.resolve({ remoteAhead: Boolean(vault.remoteAhead) });
  }

  const promise = (async (): Promise<{ remoteAhead: boolean } | null> => {
    const { token } = useAuthStore.getState();
    if (!token) return null;

    const { start, setStatus, finish, fail } = useSyncStore.getState();
    start(vaultId);
    try {
      const result = await fetchVault(vault, { token }, (label) => setStatus(label));
      await useVaultStore.getState().updateVault(vaultId, {
        lastFetchedAt: Date.now(),
        remoteAhead: result.remoteAhead,
      });
      finish({ vaultId, conflicts: [] });
      return result;
    } catch (err) {
      fail(vaultId, err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      fetchInFlight.delete(vaultId);
    }
  })();

  fetchInFlight.set(vaultId, promise);
  return promise;
}
