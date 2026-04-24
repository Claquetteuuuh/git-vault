import '@/lib/polyfills';

import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';

import { createGitFs } from '@/lib/git-fs';
import { vaultDirUri } from '@/lib/git';
import { commitAll } from '@/lib/git';
import type { Vault } from '@/lib/types';

const dir = '/repo';

type User = { login: string; name: string | null };

function author(user: User) {
  return {
    name: user.name ?? user.login,
    email: `${user.login}@users.noreply.github.com`,
  };
}

type StatusCallback = (label: string) => void;

export type SyncResult = {
  pulled: boolean;
  pushed: boolean;
  conflicts: string[];
  autoCommitSha: string | null;
};

export type SyncOptions = {
  /**
   * Skip `statusMatrix` and `commitAll` entirely when the caller knows the
   * working tree is clean (e.g. `vault.dirty === false`). This is the slow
   * path on mobile, so skipping it turns a multi-minute stall into a quick
   * fetch/push negotiation.
   */
  skipCommitIfClean?: boolean;
};

export async function syncVault(
  vault: Vault,
  auth: { token: string },
  user: User,
  onStatus?: StatusCallback,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const fs = createGitFs(vaultDirUri(vault.id));
  const onAuth = () => ({ username: 'oauth2', password: auth.token });
  const ref = vault.branch;
  const remoteRef = `refs/remotes/origin/${ref}`;

  let autoCommitSha: string | null = null;
  if (!opts.skipCommitIfClean) {
    onStatus?.('Committing local changes');
    autoCommitSha = await commitAll(
      vault,
      `GitVault auto-commit ${new Date().toISOString()}`,
      user,
    );
  }

  onStatus?.('Fetching');
  await git.fetch({
    fs,
    http,
    dir,
    remote: 'origin',
    ref,
    singleBranch: true,
    tags: false,
    onAuth,
  });

  let pulled = false;
  const conflicts: string[] = [];

  const localOid = await git.resolveRef({ fs, dir, ref });
  const remoteOid = await git.resolveRef({ fs, dir, ref: remoteRef });

  if (localOid !== remoteOid) {
    try {
      onStatus?.('Merging');
      await git.merge({
        fs,
        dir,
        ours: ref,
        theirs: remoteRef,
        author: author(user),
        message: 'GitVault auto-merge',
      });
      await git.checkout({ fs, dir, ref, force: true });
      pulled = true;
    } catch {
      onStatus?.('Resolving divergence');
      const changed = await filesChangedBetween(fs, localOid, remoteOid, true);

      const preserved = new Map<string, string>();
      for (const filepath of changed) {
        try {
          const txt = (await fs.promises.readFile(`${dir}/${filepath}`, 'utf8')) as string;
          preserved.set(filepath, txt);
        } catch {
          // file may no longer exist locally; skip
        }
      }

      await git.writeRef({ fs, dir, ref: `refs/heads/${ref}`, value: remoteOid, force: true });
      await git.checkout({ fs, dir, ref, force: true });

      const stamp = new Date().toISOString().slice(0, 10);
      for (const [filepath, content] of preserved.entries()) {
        const conflictPath = makeConflictPath(filepath, stamp);
        await fs.promises.writeFile(`${dir}/${conflictPath}`, content, 'utf8');
        await git.add({ fs, dir, filepath: conflictPath });
        conflicts.push(conflictPath);
      }

      if (conflicts.length > 0) {
        await git.commit({
          fs,
          dir,
          message: `GitVault: preserved ${conflicts.length} conflict copy(ies) after divergence`,
          author: author(user),
        });
      }
      pulled = true;
    }
  }

  // Only push if we actually have local commits the remote doesn't know about.
  // Otherwise the push is a no-op round trip that adds seconds for nothing.
  const localHead = await git.resolveRef({ fs, dir, ref });
  const remoteHead = await git.resolveRef({ fs, dir, ref: remoteRef });
  const needsPush = localHead !== remoteHead;

  let pushed = false;
  if (needsPush) {
    onStatus?.('Pushing');
    await git.push({ fs, http, dir, remote: 'origin', ref, onAuth });
    pushed = true;
  }

  return { pulled, pushed, conflicts, autoCommitSha };
}

/**
 * Lightweight variant: just `git.fetch` the branch, then report whether the
 * remote has advanced beyond our local ref. No commit, no push, no checkout.
 * Intended for the passive "is there something new?" check on vault open.
 */
export async function fetchVault(
  vault: Vault,
  auth: { token: string },
  onStatus?: StatusCallback,
): Promise<{ remoteAhead: boolean }> {
  const fs = createGitFs(vaultDirUri(vault.id));
  const onAuth = () => ({ username: 'oauth2', password: auth.token });
  const ref = vault.branch;
  const remoteRef = `refs/remotes/origin/${ref}`;

  onStatus?.('Checking remote');
  await git.fetch({
    fs,
    http,
    dir,
    remote: 'origin',
    ref,
    singleBranch: true,
    tags: false,
    onAuth,
  });

  const localOid = await git.resolveRef({ fs, dir, ref });
  const remoteOid = await git.resolveRef({ fs, dir, ref: remoteRef });
  return { remoteAhead: localOid !== remoteOid };
}

function makeConflictPath(filepath: string, stamp: string): string {
  const slash = filepath.lastIndexOf('/');
  const dirPart = slash === -1 ? '' : filepath.slice(0, slash + 1);
  const base = slash === -1 ? filepath : filepath.slice(slash + 1);
  const dot = base.lastIndexOf('.');
  const name = dot === -1 ? base : base.slice(0, dot);
  const ext = dot === -1 ? '' : base.slice(dot);
  return `${dirPart}${name}.conflict-${stamp}${ext}`;
}

/**
 * Lists file paths that differ between two commits. When `sinceMergeBase` is true,
 * the diff is taken between `a` and `mergeBase(a, b)` — i.e. what A changed relative
 * to the common ancestor. Used to preserve the local side of a diverged history.
 */
async function filesChangedBetween(
  fs: ReturnType<typeof createGitFs>,
  a: string,
  b: string,
  sinceMergeBase: boolean,
): Promise<string[]> {
  let rightOid: string = b;
  if (sinceMergeBase) {
    const bases = await git.findMergeBase({ fs, dir, oids: [a, b] });
    if (bases.length > 0) rightOid = bases[0];
  }
  const results: string[] = [];
  await git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: a }), git.TREE({ ref: rightOid })],
    map: async (filepath, entries) => {
      if (filepath === '.') return undefined;
      const [left, right] = entries;
      if (left) {
        const ltype = await left.type();
        if (ltype === 'tree') return undefined;
      }
      if (right) {
        const rtype = await right.type();
        if (rtype === 'tree') return undefined;
      }
      const loid = left ? await left.oid() : null;
      const roid = right ? await right.oid() : null;
      if (loid !== roid) results.push(filepath);
      return undefined;
    },
  });
  return results;
}
