# Screen: Settings

**Priority: 5** · Account management, vault administration, sync preferences.

## States
- `default` — all sections rendered
- `no-conflicts` — "Pending conflicts" row shows "—" instead of count

## Layout
- Header: centered "Settings" title, close button (→ Vaults)
- **Account card**: GitHub avatar tile + username + "connected · repos + email" + signed-in chip
- **Section: Vaults** — list of cloned vaults, each row is tappable (→ vault detail, not in POC); last row "Add a vault" in accent
- **Section: Sync** — toggles for auto-sync & Wi-Fi only; "Pending conflicts" row with warn-colored count
- **Section: About** — "What's new", "Privacy", destructive "Disconnect GitHub"
- Footer: version + build hash in mono, warm tagline

## Section / card pattern
- Section header: caps mono, padding `22 28 8`
- Card: margin `4`, bg `surface`, border `borderSoft`, radius `xl`, children separated by 1px `borderSoft` hairlines
- Row height 52pt (≥ 44pt tap target)

## Interactions
- Toggles animate over `motion.base` (220ms)
- "Pending conflicts" tap → modal (TODO: conflict resolver, post-MVP)
- "Disconnect GitHub" → confirmation sheet (not in prototype)

## Safe areas
- Top 54pt, bottom 34pt.
