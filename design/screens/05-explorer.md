# Screen: File Explorer

**Priority: 3** · Browse vault contents.

## States
- `default` — tree loaded
- `loading` — skeleton tree
- `empty` — "This vault is empty. Tap + to create your first note."
- `syncing` — header sync icon spins, status strip shows "syncing…"
- `error` — red status strip "Sync failed. Tap to retry."

## Layout
- Header row: back (→ Vaults), vault name + branch/freshness caption, sync button
- Search input (`surface`, radius `md`)
- Git status strip: commit hash + message + relative time, all in `mono foot`
- Tree body:
  - Folder row: caret (rotates on expand), folder icon (accent), name, count badge
  - Indented child list gets a 1px left border in `borderSoft`
  - File row: file icon, mono filename, recency label
  - Active file: accent-tinted bg + border
- FAB (new note): bottom-right, 56×56, accent bg with glow

## Interactions
- Tap folder → expand/collapse (animated chevron rotate)
- Tap file → `Note` view
- Tap sync icon → sync flow (spinner 2.4s in prototype)
- Tap FAB → new note in `note` state, edit mode on, `untitled.md`
- Pull-to-refresh on tree body → sync

## Safe areas
- Top 54pt, bottom 34pt. FAB sits 50pt from bottom (above home indicator).
