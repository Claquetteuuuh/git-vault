# GitVault — Design System

> **Dark-first, soft & modern, teal-cyan accent. Every type entry carries an explicit `lineHeight` to prevent the iOS clipping bug.**

---

## 1. Color tokens

All colors expressed for React Native. Accents use `oklch()` in web mockups and are ported to hex for RN (oklch → hex conversions below).

### Dark (primary)
| Role         | Hex        | Usage |
|---|---|---|
| `bg`         | `#0E1113`  | Root background |
| `surface`    | `#16191C`  | Cards, inputs, toolbars |
| `raised`     | `#1D2125`  | Selected rows, pressed states, icon tiles |
| `border`     | `#272B30`  | Primary borders, separators |
| `borderSoft` | `#1F2327`  | Subtle 1px hairlines inside cards |
| `text`       | `#E6E8EB`  | Primary text |
| `textDim`    | `#B4B9C0`  | Body copy, secondary text |
| `muted`      | `#8A9099`  | Captions, metadata |
| `mutedDeep`  | `#5E646C`  | Placeholder, very low emphasis |
| `accent`     | `#4BD9C9`  | Brand accent (teal-cyan) — `oklch(0.78 0.12 195)` |
| `accentSoft` | `#4BD9C9` @ 14% | Tinted backgrounds |
| `accentDim`  | `#4BD9C9` @ 55% | Hover / inactive accent |
| `success`    | `#57D9A3`  | Saved / clean state |
| `warn`       | `#D9B04B`  | Conflicts, dirty |
| `danger`     | `#E07474`  | Destructive, disconnect |

### Light (secondary)
| Role         | Hex        |
|---|---|
| `bg`         | `#FFFFFF`  |
| `surface`    | `#F6F7F8`  |
| `raised`     | `#EEF0F2`  |
| `border`     | `#E3E5E7`  |
| `borderSoft` | `#EDEFF1`  |
| `text`       | `#1A1C1E`  |
| `textDim`    | `#3B4045`  |
| `muted`      | `#6B7078`  |
| `mutedDeep`  | `#9AA0A7`  |
| `accent`     | `#2BA99A`  (teal, darkened for contrast on white) |

---

## 2. Typography

System fonts only (SF on iOS, Roboto on Android) + **IBM Plex Mono** for hashes/branches/paths (loaded via `expo-font`).

**Rule: every type entry has `lineHeight ≥ 1.3 × fontSize`. No exceptions.**

| Token      | fontSize | lineHeight | fontWeight | letterSpacing | Use |
|---|---|---|---|---|---|
| `display`  | 34 | 42 | 700 | -0.6 | Hero on Landing |
| `title`    | 26 | 34 | 700 | -0.4 | Screen large-title |
| `h1`       | 22 | 30 | 650 | -0.3 | Section header |
| `h2`       | 18 | 26 | 600 | -0.2 | Sub-section |
| `body`     | 16 | 24 | 400 |  0   | Paragraph |
| `bodyEm`   | 16 | 24 | 500 |  0   | Emphasised inline |
| `callout`  | 15 | 22 | 500 |  0   | Row title |
| `sub`      | 14 | 20 | 400 |  0   | Row detail |
| `foot`     | 12 | 18 | 500 |  0.2 | Footnote |
| `caps`     | 11 | 16 | 600 |  0.8 | Section eyebrow (uppercase) |
| `mono`     | 13 | 20 | 500 |  0   | Paths, chips |
| `monoSm`   | 11 | 16 | 500 |  0   | Small chips |

### RN snippet
```ts
export const type = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '700', letterSpacing: -0.6 },
  title:   { fontSize: 26, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  h1:      { fontSize: 22, lineHeight: 30, fontWeight: '600', letterSpacing: -0.3 },
  h2:      { fontSize: 18, lineHeight: 26, fontWeight: '600', letterSpacing: -0.2 },
  body:    { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  sub:     { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  foot:    { fontSize: 12, lineHeight: 18, fontWeight: '500', letterSpacing: 0.2 },
  caps:    { fontSize: 11, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8 },
  mono:    { fontSize: 13, lineHeight: 20, fontWeight: '500', fontFamily: 'IBMPlexMono-Medium' },
};
```

---

## 3. Spacing (4-pt grid)

| Token | px |
|---|---|
| `space.0_5` | 2 |
| `space.1`   | 4 |
| `space.2`   | 8 |
| `space.3`   | 12 |
| `space.4`   | 16 |
| `space.5`   | 20 |
| `space.6`   | 24 |
| `space.8`   | 32 |
| `space.10`  | 40 |
| `space.14`  | 56 |

Screen horizontal padding: `space.5` (20) — generous, matches "soft & modern".

---

## 4. Radii

| Token | px | Use |
|---|---|---|
| `sm`   | 8   | Chips, small badges |
| `md`   | 12  | Inputs, small buttons |
| `lg`   | 16  | Primary buttons |
| `xl`   | 20  | Card wrappers |
| `xxl`  | 28  | Hero cards, modals |
| `pill` | 9999| Toggles, status chips |

---

## 5. Shadows / Elevation

iOS (`shadow*`) and Android (`elevation`) ship together — both must be declared.

| Token  | iOS shadow                                                    | Android elevation |
|---|---|---|
| `sm`   | `{ shadowColor:'#000', shadowOpacity:0.35, shadowRadius:2, shadowOffset:{w:0,h:1} }` | 2 |
| `md`   | `{ shadowColor:'#000', shadowOpacity:0.35, shadowRadius:20, shadowOffset:{w:0,h:6} }` | 6 |
| `lg`   | `{ shadowColor:'#000', shadowOpacity:0.45, shadowRadius:48, shadowOffset:{w:0,h:18} }` | 12 |
| `glow` | Accent tint ring only — not realisable as `elevation`. On Android, fall back to `border: 1px accentDim`. | 0 |

---

## 6. Motion

| Token   | ms  | Easing |
|---|---|---|
| `fast`  | 160 | `easeOut` |
| `base`  | 220 | `easeOut` |
| `slow`  | 340 | `easeOut` |
| `spring`| —   | `cubic-bezier(0.34, 1.56, 0.64, 1)` — for success pops only |

Use `react-native-reanimated`. Avoid motion on every tap — reserve it for: save-state transitions, sync spinner, success check-mark, sheet open/close.

---

## 7. Icons

SF Symbols on iOS via `expo-symbols`; MaterialIcons on Android via `@expo/vector-icons`. Maintain a 1-to-1 mapping table. Currently in use:

| Purpose        | SF Symbol                                   | MaterialIcons equivalent |
|---|---|---|
| Vault          | `externaldrive.fill`                         | `storage` |
| Branch         | `arrow.triangle.branch`                      | `call-split` |
| Commit         | `circle.fill`                                | `radio-button-checked` |
| Sync           | `arrow.clockwise`                            | `sync` |
| Search         | `magnifyingglass`                            | `search` |
| Folder         | `folder.fill`                                | `folder` |
| File           | `doc.text.fill`                              | `description` |
| Edit           | `pencil`                                     | `edit` |
| Read           | `eye`                                        | `visibility` |
| Settings       | `gearshape.fill`                             | `settings` |
| Back           | `chevron.left`                               | `chevron-left` |
| Forward        | `chevron.right`                              | `chevron-right` |
| Check          | `checkmark`                                  | `check` |
| Close          | `xmark`                                      | `close` |
| Warning        | `exclamationmark.triangle.fill`              | `warning` |
| GitHub         | *(custom SVG)*                               | *(custom SVG)* |
| Tag            | `tag`                                        | `label` |
| Trash          | `trash`                                      | `delete` |

---

## 8. Safe areas

Use `react-native-safe-area-context`:
- **Top edge**: always respect (status bar / Dynamic Island). ~47pt on iPhone 14 Pro.
- **Bottom edge**: always respect (home indicator). ~34pt.
- **Keyboard**: wrap note-editor in `KeyboardAvoidingView` with `behavior="padding"` on iOS.

---

## 9. Component tokens

### Button
- Height: `md` 48pt, `lg` 54pt, min 44pt
- Radius: `lg` (16)
- Primary: `bg accent`, `color #041013`, soft glow shadow
- Secondary: `bg raised`, `border borderSoft`, `color text`
- Ghost: transparent, `color textDim`

### Chip
- Height 22pt, radius 7pt, padding 4×8
- Variants: `default` (raised bg), `accent`, `warn`, `danger`, `ghost` (transparent)
- Use Plex Mono for all chip text

### List row
- Min height 52pt (already ≥ 44pt tap target)
- Leading icon tile: 32×32 radius `sm`, tinted background
- Trailing: optional detail text, toggle, or `chevR`

### FAB (Explorer)
- 56×56, radius 18
- Accent background, soft glow shadow
- Bottom-right, 20pt from edges, above safe area

---

## 10. The iOS clipping rule

Never set `fontSize` without `lineHeight`. RN's default leading on iOS clips ascenders on fonts ≥ 32pt with tight letterSpacing. Enforce in code review:

```ts
// lint rule or team convention:
// Any Text style with fontSize must include lineHeight ≥ fontSize * 1.3
```
