import { create } from 'zustand';

import { deleteGithubToken, loadGithubToken, saveGithubToken, readJson, writeJson } from '@/lib/storage';
import type { GitHubUser } from '@/lib/types';

const USER_KEY = 'gitvault.github.user';

type AuthState = {
  token: string | null;
  user: GitHubUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: GitHubUser) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: async () => {
    const token = await loadGithubToken();
    const user = await readJson<GitHubUser | null>(USER_KEY, null);
    set({ token, user, hydrated: true });
  },
  setSession: async (token, user) => {
    await saveGithubToken(token);
    await writeJson(USER_KEY, user);
    set({ token, user });
  },
  signOut: async () => {
    await deleteGithubToken();
    await writeJson<GitHubUser | null>(USER_KEY, null);
    set({ token: null, user: null });
  },
}));
