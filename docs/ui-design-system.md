# Deshi Health Companion — UI Design System

Extracted from the five references in `docs/ui-reference/` plus `ui_prompt.md` §2. This is the token source for `globals.css` and every component.

---

## 0. What we took from each reference (visual notes from the actual images)

### Ref 1 — Purple fitness dashboard (`ref-1-fitness-dashboard.png`)
- **Canvas:** light lavender-grey; the whole app sits in a white **rounded outer frame** with a large margin.
- **Nav rail:** floating **violet pill** (icon-only), active icon slightly warmer/lighter inside the pill; logout sits at the bottom in a darker circle.
- **Hero "Overview" card:** large radius (~24), **violet→indigo gradient**, smooth **area chart** with a white stroke and soft fill; highlighted point = white ring + coral core; tooltip = dark pill, white text; **month selector** = light pill top-right; month chips (Jan…Apr) under the chart, active chip = white pill.
- **Notched stat strip** under the chart: three cells (Total Time / Total Steps / Target) separated by thin light dividers; tiny labels, bold white values.
- **Accent cards:** coral/pink gradient tiles with a white circular icon, title, subtitle, bottom value + circular arrow button.
- **Goal cards:** white, purple icon circle, title, subtitle, **green progress bar**, pink "N days left" pill.
- **Right column (replaced):** Friends list + map → we use **Today's meals + coach nudge + notices**.
- **Skip:** social list, live map.

### Ref 2 — DoKKo health dashboard (`ref-2-dokko-dashboard.png`)
- **Surface:** neutral grey-white; cards white with ~16–20 radius.
- **Sidebar:** labelled items + icons; **active item = solid blue pill** (full radius, white text).
- **Greeting:** "Hello, {name} 👋" bold, grey subtitle line.
- **Health Overview:** **bar-range chart** (paired vertical bars) with legend chips (dot + label).
- **Status chips:** "Scheduled" = lilac pill; "Completed" = mint pill.
- **List rows:** small icon + label + value; recent-tests style cards with coloured icon chips.
- **Buttons:** solid blue primary ("Join Video Call"); outline secondary.
- **Skip:** 3D anatomy, appointments, Upgrade Now, ECG/medical readings → slot filled by **PlateBalance**.
- **Borrow:** card hierarchy, chips, bar-range chart, labelled sidebar pattern.

### Ref 3 — Hierarchy & spacing board (`ref-3-hierarchy-spacing.png`)
- **Canvas:** very light grey; floating white frame, radius ~32.
- **Icon-only rail:** stack of circular buttons; **active = solid blue circle**; divider; **sun (theme toggle)** at the bottom.
- **Top bar:** logo left, **search pill** centre (full radius, soft grey), bell (red dot) + avatar right.
- **Hierarchy:** page title 32–40 bold → section label = **small blue dot + bold text** ("• Heart Conditions") → card title → value.
- **Stat cards:** white, radius ~16, soft shadow; label grey small + bold value; **inset chart area** (soft grey, radius ~12) holds sparkline/bars; one active card = solid blue.
- **8pt grid** explicit in the board: 8 / 16 / 24 / 32 / 40 / 48 / 56.
- **Neumorphic softness:** very subtle shadow, not heavy clay.

### Ref 4 — himotou exercise (`ref-4-himotou-exercise.png`)
- **Canvas:** pale blue-lavender; white outer frame.
- **Left sidebar:** "Menu" label, icon+label items, event list with radio circles, user pill at bottom.
- **Top tabs:** underline style — active bold dark + underline; inactive grey.
- **Title:** very large grey display type + small "Day 21" subtitle.
- **Hero exercise:** **circular timer chip** (ring + "4:35"), bold activity name, grey "6 x 5 minutes"; illustration centre; **segmented progress** (3 segments, filled purple).
- **"Next" row:** three white cards, illustration + name + duration.
- **Pastel quick tiles (2×3):** mint / sky / lilac / peach backgrounds with darker same-hue icons and two-line labels.
- **Semi-circle gauge:** purple fill, tick marks, bold centre value, label above.
- **Toast:** mint pill at the bottom with icon + calm success copy.
- **Skip:** "30 days to lose 30lb" promise, anatomy figure → neutral rhythm headline + line icon.

### Ref 5 — Konekta login (`ref-5-login.png`)
- **Page:** warm grey (`#D6D5D0`-ish).
- **Card:** white, radius ~40, generous padding, centred with outer margin.
- **Left panel:** botanical image, radius ~24; **hidden below 768px**.
- **Right form:** centred logo + wordmark; bold title; grey subtitle; **pill inputs** with grey labels above; remember + underlined forgot; **full-width violet pill button**; "Or continue with" divider; grey pill social buttons; footer "New here? **Create account**".
- **Skip:** Apple button (Google only per ui_prompt).

---

## 1. Color tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ink` | `#1E1A2E` | `#F1EFF8` | Primary text |
| `--canvas` | `#EEEDF5` | `#14121F` | Page background (lavender-grey, refs 1 & 3) |
| `--surface` | `#FFFFFF` | `#1D1A2C` | Cards / frame |
| `--surface-soft` | `#F6F5FA` | `#25223A` | Inner tiles, inputs, inactive chips |
| `--violet` | `#5B3E9E` | `#9B84E0` | Primary actions, rail, hero base |
| `--violet-soft` | `#7C5CE0` | `#B4A0F0` | Hero gradient top, hover |
| `--blue` | `#2F62F0` | `#6C93FF` | Active nav pill, links, chart secondary |
| `--coral` | `#F2678F` | `#FF86A7` | Accent cards, highlight point |
| `--leaf` | `#2F8F67` | `#59C596` | Balanced / success / plate good |
| `--turmeric` | `#E9A23B` | `#F5BC62` | Gentle caution (never red) |
| `--rose` | `#D94A6B` | `#FF7A9E` | **Form errors only** |

Pastel tiles (ref 4): `mint #E4F6EC` · `sky #E3F0FF` · `lilac #ECE6FA` · `peach #FDEBDD` (dark variants: `#1A3A2A` / `#1A2E44` / `#2A2244` / `#3A2A1A` icons on `#1E3A2C` / `#1A2838` / `#252040` / `#3A2C1E` bgs).

**Rules:** AA contrast; never pure red for calorie states; semantic colour always paired with icon/text.

## 2. Typography
- **Latin:** Manrope · **Bangla:** Hind Siliguri (fallback Noto Sans Bengali). Loaded via `next/font`, `display: swap`.
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 40. Weights 400 / 500 / 700 / 800.
- Bangla: `line-height 1.65`, ~1px larger at body. Tabular figures for stats. `Intl.NumberFormat('bn-BD')` when Bangla.

## 3. Spacing, radius, elevation
- **8pt grid:** 8, 16, 24, 32, 40, 48, 56, 64. Card padding 24 (16 mobile). Gaps 16–24.
- **Radii:** page frame 32 · card 24 · tile 16 · chip/button/input 999.
- **Shadows:** card `0 8px 24px rgb(60 40 120 / 0.08)`; inset variant for stat tiles. Dark: border + subtle glow.
- **Hero gradients only** inside hero cards (violet→indigo; coral tiles may gradient).

## 4. Motion
- One orchestrated load moment on `/home`: ring fill + area chart draw. Respect `prefers-reduced-motion`.
- Interaction only: tab underline, sheet, chip select, slider, toast, log confirmation.

## 5. Layout
- Mobile first (360–430): bottom tabs — Home, Plan, **Log (raised centre)**, Coach, Activity; settings in avatar menu.
- Tablet 768+: icon-only floating rail (refs 1 & 3).
- Desktop 1280+: labelled sidebar (ref 2, active blue pill) + right panel (ref 1 slot for meals/nudge); whole app in rounded frame on lavender canvas.
- Left-aligned everywhere; centre only login title block + empty states.
