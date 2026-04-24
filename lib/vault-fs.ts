import * as FileSystem from 'expo-file-system/legacy';

import { vaultDirUri } from '@/lib/git';

export type VaultEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
  isMarkdown: boolean;
};

export function vaultRepoUri(vaultId: string): string {
  return vaultDirUri(vaultId) + 'repo/';
}

function normalizeDirPath(path: string): string {
  if (!path) return '';
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed;
}

/**
 * Lists entries in a directory within a vault.
 * @param vaultId the vault's local id
 * @param dirPath relative path inside the repo (e.g. "folder/sub"), or "" for root
 */
export async function listDirectory(vaultId: string, dirPath: string): Promise<VaultEntry[]> {
  const normalized = normalizeDirPath(dirPath);
  const base = vaultRepoUri(vaultId);
  const targetUri = normalized ? base + normalized + '/' : base;

  const names = await FileSystem.readDirectoryAsync(targetUri);

  const entries = await Promise.all(
    names.map(async (name) => {
      const childUri = targetUri + name;
      const info = await FileSystem.getInfoAsync(childUri);
      const relPath = normalized ? `${normalized}/${name}` : name;
      return {
        name,
        path: relPath,
        isDirectory: Boolean(info.isDirectory),
        isMarkdown: !info.isDirectory && name.toLowerCase().endsWith('.md'),
      };
    }),
  );

  return entries
    .filter((e) => !shouldHide(e.name))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

function shouldHide(name: string): boolean {
  if (name === '.git') return true;
  if (name.startsWith('.')) return true;
  return false;
}

export async function readNote(vaultId: string, relPath: string): Promise<string> {
  const uri = vaultRepoUri(vaultId) + relPath;
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function writeNote(vaultId: string, relPath: string, contents: string): Promise<void> {
  const uri = vaultRepoUri(vaultId) + relPath;
  await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });
}

export function dirname(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

export function basename(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? path : path.slice(idx + 1);
}
