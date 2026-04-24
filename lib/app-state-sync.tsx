import { useEffect } from 'react';

/**
 * Previously this listened to `AppState` transitions and fired off a full sync
 * for every vault whenever the app backgrounded. That did:
 *  - commitAll (statusMatrix over the entire working tree — slow)
 *  - fetch + push
 * …every single time, even when the user had touched nothing. On a 100 MB
 * vault this made the app feel unusable.
 *
 * Behaviour is now: nothing automatic. Sync is user-initiated via the sync
 * button (or pull-to-refresh) in the vault explorer. If auto-sync becomes a
 * useful feature again, make sure it uses `runFetch` (not `runSync`) and
 * respects the `dirty`/`lastFetchedAt` state on each vault.
 */
export function useAppStateSync() {
  useEffect(() => {
    // no-op — intentionally
  }, []);
}
