import '@/lib/polyfills';

import * as FileSystem from 'expo-file-system/legacy';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';

import { createGitFs, deleteDirectory, ensureDirectory } from '@/lib/git-fs';
import type { Vault } from '@/lib/types';

export const VAULTS_ROOT = FileSystem.documentDirectory + 'vaults/';

export function vaultDirUri(vaultId: string): string {
  return VAULTS_ROOT + vaultId + '/';
}

const gitDir = '/repo';

type Auth = { token: string };

function author(user: { login: string; name: string | null }) {
  return {
    name: user.name ?? user.login,
    email: `${user.login}@users.noreply.github.com`,
  };
}

function authenticatedUrl(cloneUrl: string, token: string): string {
  return cloneUrl.replace('https://', `https://oauth2:${token}@`);
}

type ProgressFn = (phase: string, loaded?: number, total?: number) => void;

export type CloneOptions = {
  cloneUrl: string;
  branch: string;
  token: string;
  depth?: number;
  onProgress?: ProgressFn;
};

export async function cloneVault(
  vaultId: string,
  opts: CloneOptions,
): Promise<void> {
  const rootUri = vaultDirUri(vaultId);
  await ensureDirectory(VAULTS_ROOT);
  await deleteDirectory(rootUri);
  await ensureDirectory(rootUri);
  await ensureDirectory(rootUri + 'repo/');

  const fs = createGitFs(rootUri);

  try {
    await git.clone({
      fs,
      http,
      dir: gitDir,
      url: authenticatedUrl(opts.cloneUrl, opts.token),
      ref: opts.branch,
      singleBranch: true,
      depth: opts.depth ?? 1,
      onProgress: opts.onProgress
        ? (p) => opts.onProgress?.(p.phase, p.loaded, p.total)
        : undefined,
    });
  } catch (err) {
    await deleteDirectory(rootUri);
    throw err;
  }
}

export async function pullVault(vault: Vault, auth: Auth): Promise<void> {
  const fs = createGitFs(vaultDirUri(vault.id));
  await git.pull({
    fs,
    http,
    dir: gitDir,
    ref: vault.branch,
    singleBranch: true,
    author: { name: 'GitVault', email: 'gitvault@local' },
    onAuth: () => ({ username: 'oauth2', password: auth.token }),
  });
}

export async function commitAll(
  vault: Vault,
  message: string,
  user: { login: string; name: string | null },
): Promise<string | null> {
  const fs = createGitFs(vaultDirUri(vault.id));
  const status = await git.statusMatrix({ fs, dir: gitDir });

  let changed = false;
  for (const [filepath, head, workdir, stage] of status) {
    if (workdir !== stage) {
      changed = true;
      if (workdir === 0) {
        await git.remove({ fs, dir: gitDir, filepath });
      } else {
        await git.add({ fs, dir: gitDir, filepath });
      }
    } else if (head !== workdir) {
      changed = true;
      await git.add({ fs, dir: gitDir, filepath });
    }
  }

  if (!changed) return null;

  return git.commit({
    fs,
    dir: gitDir,
    message,
    author: author(user),
  });
}

export async function pushVault(vault: Vault, auth: Auth): Promise<void> {
  const fs = createGitFs(vaultDirUri(vault.id));
  await git.push({
    fs,
    http,
    dir: gitDir,
    remote: 'origin',
    ref: vault.branch,
    onAuth: () => ({ username: 'oauth2', password: auth.token }),
  });
}

export async function hasLocalChanges(vault: Vault): Promise<boolean> {
  const fs = createGitFs(vaultDirUri(vault.id));
  const status = await git.statusMatrix({ fs, dir: gitDir });
  return status.some(([, head, workdir, stage]) => head !== workdir || workdir !== stage);
}

export type RepoSummary = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  cloneUrl: string;
  description: string | null;
  updatedAt: string;
};

export async function listUserRepos(token: string): Promise<RepoSummary[]> {
  const out: RepoSummary[] = [];
  let page = 1;
  while (page < 5) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!res.ok) throw new Error(`GitHub repos: ${res.status}`);
    const items = (await res.json()) as Array<Record<string, unknown>>;
    if (items.length === 0) break;
    for (const r of items) {
      out.push({
        id: r.id as number,
        name: r.name as string,
        fullName: r.full_name as string,
        owner: (r.owner as { login: string }).login,
        private: Boolean(r.private),
        defaultBranch: (r.default_branch as string) ?? 'main',
        htmlUrl: r.html_url as string,
        cloneUrl: r.clone_url as string,
        description: (r.description as string | null) ?? null,
        updatedAt: r.updated_at as string,
      });
    }
    if (items.length < 100) break;
    page += 1;
  }
  return out;
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\.git$/, '');
  const m = trimmed.match(/github\.com[/:]([^/]+)\/([^/]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}
