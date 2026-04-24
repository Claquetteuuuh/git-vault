# GitVault — Design package

This folder is the design handoff for claude-code.

- `DESIGN-SYSTEM.md` — tokens (color, type, spacing, radii, shadows, motion, icons, safe areas, component tokens)
- `screens/01–07 …md` — one spec per screen (states, layout, interactions, safe-area rules, pain-point fixes)

## Implementation priority
1. Landing (`01-landing.md`)
2. Onboarding (`02-onboarding.md`)
3. Vaults (`03-vaults.md`)
4. Add Vault (`04-add-vault.md`)
5. File Explorer (`05-explorer.md`)
6. Note view (`06-note.md`)
7. Settings (`07-settings.md`)

## Variants
- **Landing**: A (editorial) and B (terminal). Ship A.
- **Note view**: A (clean) and B (git-split). Ship A; expose B behind a feature flag for later.

## Non-negotiable rules
1. Every `Text` style with a `fontSize` ≥ 20 **must** include an explicit `lineHeight ≥ 1.3 × fontSize`.
2. All interactive elements ≥ 44×44pt.
3. Both `shadow*` (iOS) and `elevation` (Android) are always declared for any elevated surface.
4. Respect top + bottom safe areas on every screen.
5. Dark mode is primary; light mode must work but is secondary.
