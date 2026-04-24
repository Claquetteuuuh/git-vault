# Screen: Note view / edit

**Priority: 4** · Read markdown; tap pencil to edit as plain text. Two variants (A clean, B git-split) — ship A first.

## States
- `read` — rendered markdown
- `edit` — `TextInput` with markdown source, toolbar pinned above keyboard
- `dirty` — accent "saving…" chip pulsing
- `saved` — ghost "saved" chip with checkmark
- `conflict` — banner above body "Merge conflict detected · Resolve"
- `unavailable` — "This file was moved or deleted. Go back."

## Layout (variant A — Clean)
- Header: back button with "daily" breadcrumb; state chip (saving/saved); mode toggle (eye/pencil)
- Frontmatter chip row: filename, date, tags
- Body (`type.body`, `color.textDim`, letterSpacing -0.1):
  - `h1` title in `fontSize 30 / lineHeight 38`
  - Metadata caption "last saved · 2s ago · local only" in mono
  - Rendered markdown: paragraphs, `h2`, lists, code inline & block, blockquote (accent border-left)
  - Wikilinks rendered as accent chips
- Edit mode: monospaced source with block cursor, toolbar bar (undo/redo/bracket/file/tag/link + keyboard-dismiss)

## Layout (variant B — Git-split)
- Header: back (icon only), path in mono, compact mode toggle button
- Git status strip: branch chip + commit chip + clean/diff chip + filesize
- Body: same markdown rendering, tighter leading
- If dirty: inline "Uncommitted changes" card showing the diff (added/removed lines)

## Interactions
- Pencil ↔ Eye: toggle mode (animated icon swap)
- Typing in edit mode → `dirty` state → debounced save (800ms) → `saved`
- Tap toolbar button → inserts markdown glyph at cursor
- Keyboard avoidance: `KeyboardAvoidingView` with `behavior="padding"` (iOS) / `"height"` (Android)

## Safe areas
- Top 54pt, bottom 34pt (but toolbar replaces bottom padding in edit mode).

## Pain-point fixes
- All type entries have explicit `lineHeight` — no hero clipping.
- Dirty-indicator is always visible (accent pulsing dot) and reassures with "saving…" copy.
