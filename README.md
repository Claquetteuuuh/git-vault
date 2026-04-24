# GitVault

Mobile markdown notebook that syncs with a GitHub repository over the Device Flow — an alternative to Obsidian Mobile for users who keep their notes in Git.

> POC / alpha. Built with Expo SDK 54, TypeScript, `expo-router`, `isomorphic-git`.

## What works today

- GitHub OAuth **Device Flow** login — no password, no client secret.
- Clone a repo (shallow, `depth: 1`) into the app's sandbox.
- Browse folders and markdown files.
- Read notes with a themed markdown renderer (YAML frontmatter stripped).
- Edit notes with a plain `TextInput`. Saves debounced to disk.
- Smart sync:
  - auto-commit any local changes,
  - fetch + fast-forward/trivial merge when possible,
  - on real divergence, keep the remote version and preserve local edits in `<file>.conflict-YYYY-MM-DD.md`,
  - push.
- Manual sync button in the vault header, automatic sync on vault open, debounced sync after edits, and push when the app is backgrounded.

## What's explicitly out of scope (for now)

Images / attachments, wikilinks `[[note]]`, backlinks, graph view, plugins, full-text search, GitLab, CodeMirror editor.

## Running the POC

Prereqs: Node 20+, Expo Go on your phone.

```sh
cd gitvault-mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. On first launch, tap **Connect GitHub** and follow the Device Flow instructions (copy the 8-character code, paste it on github.com/login/device, approve).

## Configuration

The GitHub **Client ID** is set in `lib/github-oauth.ts`. Device Flow does not require a client secret. If you fork this project, register your own OAuth App at <https://github.com/settings/developers> with "Enable Device Flow" turned on, and replace the ID.

## Architecture

```
app/                     expo-router screens
  _layout.tsx            root Stack + AppState sync
  index.tsx              vault list
  onboarding.tsx         Device Flow UI
  settings.tsx           account / vaults / conflicts
  vault/new.tsx          repo picker + URL clone
  vault/[vaultId]/
    _layout.tsx
    index.tsx            file explorer + sync control
    note.tsx             reader / editor

lib/
  github-oauth.ts        Device Flow helpers
  git.ts                 isomorphic-git wrappers
  git-fs.ts              expo-file-system → fs.promises adapter
  vault-fs.ts            user-level file ops (list, read, write)
  sync.ts                commit + fetch + merge + push orchestration
  sync-controller.ts     per-vault serialisation + store updates
  app-state-sync.tsx     background-transition listener
  frontmatter.ts         YAML split helper
  polyfills.ts           Buffer global

store/                   zustand stores (auth, vaults, sync)
```

## Known caveats

- **Shallow clone only.** `depth: 1` keeps clone times reasonable; history-heavy operations (blame, log beyond the last commit) aren't supported.
- **Slow on large repos.** `isomorphic-git` is pure JS over `expo-file-system`, which is fine for small vaults but can be sluggish on hundreds-of-MB repos. A 100 MB vault will take noticeable minutes to first-clone on a phone.
- **Merge capability is minimal.** `isomorphic-git` merges only cleanly-fast-forwardable or trivially-mergeable histories. Real divergence goes through the conflict-file fallback rather than a three-way merge UI.
- **No background intervals.** Mobile OSes do not reliably run user-defined background tasks on a 5-minute cadence. GitVault syncs on open, on edit, on manual tap, and on app-backgrounded transitions instead.
