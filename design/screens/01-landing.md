# Screen: Landing

**Priority: 1** · Unauthenticated home. First impression. Two variants available (A editorial, B terminal) — ship A first.

## States
- `default` — the only state. No auth check yet.

## Layout (variant A, recommended)

| Region | Tokens |
|---|---|
| Top safe area | `62pt` |
| Header row | padding `4, 6`; brand mark + version chip |
| Hero block | padding `6`, gap `5` |
| Eyebrow chip | `type.foot`, bg `surface`, border `borderSoft`, `mono` font |
| Hero title | `fontSize 38, lineHeight 46, weight 700, letterSpacing -0.8`; second line in `color.accent` |
| Hero body | `type.body`, `color.textDim`, max-width 320 |
| Feature list | 3 rows, icon tile 36×36 radius `md` bg `surface`, accent icons |
| CTA block | padding `5, 4`; primary button + fine-print caption |
| Bottom safe | `34pt` |

## Interactions
- Tap **Connect GitHub** → navigate to `Onboarding` (step `idle`).
- Tap version chip → no-op (reserved for changelog).

## Safe areas
- **Top**: respected with 62pt pad (status bar + breathing room).
- **Bottom**: respected with 34pt home-indicator pad.

## Pain-point fixes
- Explicit `lineHeight: 46` on hero title prevents iOS ascender clipping.
- Feature list breaks up the dead-middle space from the current build.
- Human copy: "Your notes. Your repo. Your rules." replaces generic marketing voice.
