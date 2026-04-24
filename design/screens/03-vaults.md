# Screen: Vaults (authenticated home)

**Priority: 2** · First screen after successful auth.

## States
- `default` — list of cloned vaults + "Add a vault" CTA
- `loading` — skeleton rows (3× row height 76pt, surface bg, shimmer)
- `empty` — no vaults yet; only "Add a vault" prominent + helper copy "Let's set up your first vault"
- `syncing` (per-row) — accent dot beside `branch` chip

## Layout
- Header row: settings button (left), brand lockup (center), spacer (right)
- Greeting block: "welcome back, @username" (mono sub), then `type.title`
- Vault list: each row 76pt, bg `surface`, border `borderSoft`, radius `xl`
  - 44×44 vault tile with per-vault gradient fill
  - Title (`callout`, weight 600) + mono meta (branch · ago, dirty-dot)
  - Trailing chevron
- Bottom: dashed-border "Add a vault" tile

## Interactions
- Tap vault row → `Explorer` (passes vault id)
- Tap "Add a vault" → `AddVault`
- Tap settings icon → `Settings`

## Safe areas
- Top 54pt, bottom 34pt.
