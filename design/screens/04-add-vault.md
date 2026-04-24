# Screen: Add Vault

**Priority: 3** · Pick from GitHub repos or paste a URL.

## States
- `picker` — tabbed: "Your repos" / "Paste URL"
- `selected` — a repo row highlighted, primary CTA enabled
- `cloning` — full-screen progress takeover (no tabs visible)
- `error` — inline error under primary button ("Clone failed · retry")

## Layout

### Picker (tab: Your repos)
- Segmented control at top (`surface` bg, `raised` selected pill)
- Search input (`surface`, radius `md`, muted icon)
- Repo list: each row has 36×36 gradient tile, mono name, caption meta, trailing radio
- Radio: 22×22, unfilled → 1.5px border `border`; filled → `accent` bg + inverted check

### Picker (tab: Paste URL)
- Caps label "REPOSITORY URL"
- Text input styled in `mono`, placeholder accent-tinted
- Helper copy in `sub muted`

### Cloning
- Centered gradient tile (matches selected repo) with `glow` shadow
- `type.h1` title "Cloning {repo-name}"
- Mono status string changing with progress: "Resolving refs…", "Receiving objects…", "Unpacking…", "Checking out…"
- Progress bar 6pt tall, rounded, `accent` fill with soft glow
- Percent label below in mono

## Interactions
- Tab switch: animated segmented control
- Select row → primary CTA updates to "Clone {name}"
- Tap clone → `cloning` state, auto-advances to `Explorer` on completion

## Pull-to-refresh
- In repo list: refresh the user's repo list from GitHub (not yet in prototype)

## Safe areas
- Top 54pt, bottom 34pt.
