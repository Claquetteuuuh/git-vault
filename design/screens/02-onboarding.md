# Screen: Onboarding (Connect GitHub)

**Priority: 2** · Device Flow UX.

## States
- `idle` — 3-step explainer, primary CTA "Get my code"
- `code` — 6-8 char code displayed, expiration countdown, "Copy & open GitHub"
- `polling` — spinner + "Waiting for GitHub…" + echo code chip
- `success` — green checkmark pop, auto-advances to Vaults after 1.5s
- `error` (not yet in prototype) — code expired / revoked; CTA "Get a new code"

## Layout per state

### Idle
- Header: back chevron (→ Landing), "step 1 / 2" mono caption
- Title `h1` + body
- Explainer card: bg `surface`, radius `xl`, padding `4`, 3 numbered steps
- Footer: primary button full-width

### Code
- Large code display in `mono`, `fontSize 44 / lineHeight 52`, letterSpacing 8
- Card bg `surface` with `glow` elevation
- Expiration timer in `mono foot`
- Secondary button: "Copy & open GitHub"
- Primary button: "I pasted it · keep waiting" → polling

### Polling
- 64×64 icon tile rotating (`motion.slow` spin loop)
- Title + muted caption
- Echo of code as chip

### Success
- 72×72 success tile, `oklch(0.78 0.14 155 / 0.15)` bg, animated `pop`
- 1500ms timeout → Vaults

## Interactions
- Back at any step → Landing
- In-prototype: Code → Polling → Success auto-sequenced via state transitions

## Safe areas
- Top 54pt, bottom 34pt.

## Pain-point fixes
- Idle state filled with 3-step explainer (not sterile "logo + button" dead middle).
- Copy reassures: "No passwords leave github.com" reinforced at every step.
