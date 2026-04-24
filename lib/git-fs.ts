import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

type Stats = {
  type: 'file' | 'dir' | 'symlink';
  mode: number;
  size: number;
  ino: number;
  mtimeMs: number;
  ctimeMs: number;
  uid: number;
  gid: number;
  dev: number;
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
};

function errno(code: string, path: string, syscall: string): Error & { code: string } {
  const err = new Error(`${code}: ${syscall} '${path}'`) as Error & { code: string };
  err.code = code;
  return err;
}

function buildStats(info: { isDirectory?: boolean; size?: number; modificationTime?: number }): Stats {
  const isDir = Boolean(info.isDirectory);
  const size = info.size ?? 0;
  const mtimeMs = (info.modificationTime ?? 0) * 1000;
  return {
    type: isDir ? 'dir' : 'file',
    mode: isDir ? 0o040755 : 0o100644,
    size,
    ino: 0,
    mtimeMs,
    ctimeMs: mtimeMs,
    uid: 1,
    gid: 1,
    dev: 1,
    isFile: () => !isDir,
    isDirectory: () => isDir,
    isSymbolicLink: () => false,
  };
}

export type GitFs = {
  promises: {
    readFile: (
      filepath: string,
      options?: { encoding?: string } | string,
    ) => Promise<Uint8Array | string>;
    writeFile: (
      filepath: string,
      data: Uint8Array | string,
      options?: { encoding?: string } | string,
    ) => Promise<void>;
    unlink: (filepath: string) => Promise<void>;
    readdir: (filepath: string) => Promise<string[]>;
    mkdir: (filepath: string) => Promise<void>;
    rmdir: (filepath: string) => Promise<void>;
    stat: (filepath: string) => Promise<Stats>;
    lstat: (filepath: string) => Promise<Stats>;
    readlink: (filepath: string) => Promise<string>;
    symlink: (target: string, filepath: string) => Promise<void>;
    chmod: (filepath: string, mode: number) => Promise<void>;
  };
};

/**
 * Creates an fs.promises-compatible object backed by expo-file-system,
 * rooted at rootUri (e.g. FileSystem.documentDirectory + 'vaults/<id>/').
 *
 * All isomorphic-git paths are absolute POSIX (e.g. '/repo/.git/HEAD').
 * We strip the leading '/' and prepend rootUri.
 */
export function createGitFs(rootUri: string): GitFs {
  const root = rootUri.endsWith('/') ? rootUri : rootUri + '/';

  const resolve = (p: string): string => {
    const clean = p.startsWith('/') ? p.slice(1) : p;
    return root + clean;
  };

  const readFile = async (
    filepath: string,
    options?: { encoding?: string } | string,
  ): Promise<Uint8Array | string> => {
    const uri = resolve(filepath);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) throw errno('ENOENT', filepath, 'open');
    if (info.isDirectory) throw errno('EISDIR', filepath, 'open');

    const encoding = typeof options === 'string' ? options : options?.encoding;
    if (encoding === 'utf8' || encoding === 'utf-8') {
      return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    }
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const buf = Buffer.from(base64, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  };

  const ensureParent = async (uri: string): Promise<void> => {
    const lastSlash = uri.lastIndexOf('/');
    if (lastSlash <= 0) return;
    const parentUri = uri.slice(0, lastSlash);
    // Never try to create above root.
    if (!parentUri.startsWith(root) || parentUri.length <= root.length - 1) return;
    const info = await FileSystem.getInfoAsync(parentUri);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(parentUri, { intermediates: true });
    }
  };

  const writeFile = async (
    filepath: string,
    data: Uint8Array | string,
    options?: { encoding?: string } | string,
  ): Promise<void> => {
    const uri = resolve(filepath);
    await ensureParent(uri);
    const encoding = typeof options === 'string' ? options : options?.encoding;

    if (typeof data === 'string') {
      await FileSystem.writeAsStringAsync(uri, data, {
        encoding:
          encoding === 'base64' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
      });
      return;
    }

    const base64 = Buffer.from(data).toString('base64');
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  };

  const unlink = async (filepath: string): Promise<void> => {
    await FileSystem.deleteAsync(resolve(filepath), { idempotent: false });
  };

  const readdir = async (filepath: string): Promise<string[]> => {
    const uri = resolve(filepath);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) throw errno('ENOENT', filepath, 'scandir');
    if (!info.isDirectory) throw errno('ENOTDIR', filepath, 'scandir');
    return FileSystem.readDirectoryAsync(uri);
  };

  const mkdir = async (filepath: string): Promise<void> => {
    const uri = resolve(filepath);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      if (info.isDirectory) return;
      throw errno('EEXIST', filepath, 'mkdir');
    }
    // intermediates: true so isomorphic-git's deep paths
    // (e.g. .git/refs/remotes/origin/) succeed even when parents weren't
    // explicitly mkdir'd by the caller.
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  };

  const rmdir = async (filepath: string): Promise<void> => {
    await FileSystem.deleteAsync(resolve(filepath), { idempotent: false });
  };

  const stat = async (filepath: string): Promise<Stats> => {
    const info = await FileSystem.getInfoAsync(resolve(filepath));
    if (!info.exists) throw errno('ENOENT', filepath, 'stat');
    return buildStats(info);
  };

  const lstat = stat;

  const readlink = async (filepath: string): Promise<string> => {
    throw errno('ENOTSUP', filepath, 'readlink');
  };

  const symlink = async (_target: string, filepath: string): Promise<void> => {
    throw errno('ENOTSUP', filepath, 'symlink');
  };

  const chmod = async (_filepath: string, _mode: number): Promise<void> => {
    // No-op: mobile sandbox filesystems don't surface POSIX permissions.
  };

  return {
    promises: {
      readFile,
      writeFile,
      unlink,
      readdir,
      mkdir,
      rmdir,
      stat,
      lstat,
      readlink,
      symlink,
      chmod,
    },
  };
}

export async function ensureDirectory(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

export async function deleteDirectory(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
