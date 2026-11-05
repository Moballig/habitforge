# UI Implementation Prompt: Deshi Health Companion (self-contained)

> Paste this whole file into Claude Code (or any coding agent) at the repo root.
> It contains **everything needed to design and build the frontend. No reference images are required.** Every visual pattern is described in words, with exact sizes, colours and layouts.
> **Two parts:** Part A is a usability pass on the existing app (do first; mostly copy, structure and CSS). Part B is the full visual redesign (adopt after submission). Where they disagree, Part A wins.

---

## Required skills (mandatory for every agent that touches this repo)

Two skills are required. No agent starts UI work until both are installed and active. Run these in Claude Code, then start a new session so the hooks and skills load:

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail

/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

- If the marketplace route fails for ui-ux-pro-max, use its CLI: `npm install -g ui-ux-pro-max-cli`, then `uipro init --ai claude` (check the repo README for the current package name; older docs call it `uipro-cli`).
- On other agents (Codex, Cursor, Copilot CLI and so on), use the matching install from the ponytail README. In Codex the skills are called with `@`, for example `@ponytail-review`.
- If a skill cannot be installed, **stop and report it**. Do not continue without it.
- Keep a one-line-per-use log in `docs/skills-log.md` (which skill, which page or tier, what it changed).

| Skill | Use it for | Where it stops |
|---|---|---|
| **ui-ux-pro-max** | Before each page: UX guidelines, accessibility, chart-type choice, icons, motion and Next.js/Tailwind guidance for that page. After each page: its review checks. Once at the start: run its design-system generator with this brief (Bangladeshi health companion, violet, mobile first, Bangla) and save the output next to our tokens in `docs/ui-design-system.md` | The tokens, fonts, patterns and product rules in this file **win** over its palette, style and font suggestions. Accept a change from it only when it fixes accessibility or usability, and record each one in `docs/ui-design-system.md` |
| **ponytail** | All code: write the least code that meets the spec; use native HTML/CSS (`<dialog>`, `<details>`, popover, grid, container queries) before adding a component or library; no abstraction with a single caller; mark every deliberate shortcut with a `ponytail:` comment that names its upgrade path. Run `/ponytail-review` on each tier before its commit and `/ponytail-debt` before submission | It never overrides the product rules in section 0, accessibility, Bangla and number formatting through `lib/format.ts`, safety-mode handling, the Tier A scope or the hand-written SVG charts. If it and this spec disagree on **what** to build, this spec decides; on **how much code** to write, ponytail decides |

The built-in `frontend-design` skill stays in use for the plan-review step in section 9. Optional: a Playwright MCP for the screenshots section 9 asks for at 360, 768 and 1280 px.

---

# Part A: Usability pass on the existing app (do this first)

The app already exists (Next.js 16, Tailwind 4, Convex, Groq; routes `/home /log /plan /activity /insights /family /coach /settings /onboarding`). This part makes it easier to use **without rebuilding it**. Where Part A and Part B disagree, **Part A wins**. Part B is the full visual redesign to adopt after submission.

For this pass, `ponytail` means delete, collapse or relabel before you add anything, and `ui-ux-pro-max` supplies the UX and accessibility checks you run on every screen you touch.

## A0. Who we design for and how we measure it

The user is a Bangladeshi adult on a 360 to 400 px phone, often outdoors in bright light, sometimes low-literacy, using one hand, switching between Bangla and English. They want two answers: **What should I do next? Am I OK today?**

Run these four tests before submission, with three real people if you can:
1. **5-second test:** show `/home`; they say what to do next.
2. **60-second test:** a new user logs "ruti dim bhaji cha" from the first screen without help.
3. **Reach test:** the main action on each screen is reachable with the right thumb.
4. **Jargon test:** nobody asks what a word on the main screens means.

## A1. Findings and fixes, ranked

Effort: **S** under 1 hour, **M** a few hours, **L** after submission.

| # | Problem | Fix | Effort |
|---|---|---|---|
| 1 | Home stacks about six blocks (energy banner, plate tabs, disclaimer, next move, water, rice) and the next action is buried | One Today card and one next action first; the rest below or behind Details (A2) | M |
| 2 | Jargon on screen: TDEE, BMR, Safe Floor, Adaptive TDEE, rolling deficit, rebalance window, what-if simulator | Plain wording (A4) | S |
| 3 | Bottom tabs leave out Insights and Family, so phone users cannot reach them | A More sheet from the avatar (A3) | S |
| 4 | Buildathon badge and an always-on sync pill in the top bar | Remove the badge; show the sync pill only when offline or changes are waiting | S |
| 5 | Calorie overshoot uses coral/rose `#f43f5e`, which reads as red and shames | Amber only; rose is reserved for form errors (A11) | S |
| 6 | Accent colours used as text fail contrast: emerald `#10b981` about 2.5:1, amber `#f59e0b` about 2.1:1, sky `#0ea5e9` about 2.8:1, indigo `#6366f1` about 4.4:1 | Use them for fills and icons; text uses the text-safe shades in A11 | S |
| 7 | Numbers set in JetBrains Mono, which has no Bengali digits, so ১২৫০ falls back to another font and breaks alignment | Drop the mono face; use the main fonts with tabular figures (A10) | S |
| 8 | Ranges everywhere (`≈ 350–420 kcal`) make every number slow to read | Headline "about 385" with the range as a small caption (A10) | S |
| 9 | Faint neumorphic borders (`rgba(0,0,0,0.06)`) and cold zinc neutrals wash out in sunlight and feel clinical | Flat cards with a visible 1px border and warm neutrals (A11) | S |
| 10 | "🌸 Women-Friendly Home Mode" badge in the header shows a personal setting to anyone nearby | Rename to "Home workouts only"; keep it in Settings and as a quiet filter chip on Activity; no header badge | S |
| 11 | Plan shows advanced controls up front (window 3 to 7 days, 60/40 split, what-if slider) | One recommended plan with a single Adjust button (A7) | M |
| 12 | Activity is one long page (weather, prayer strip, four routines, progression, pyramid, sparklines, gauge) | A Right now card first; the rest collapsed (A8) | M |
| 13 | Logging depends on typing Banglish on a phone | Big tap tiles for usual foods, smart defaults, live total, undo (A5) | M |
| 14 | Onboarding asks eight things before any value, including health conditions | Three questions, then show the first day; ask the rest later (A6) | L |
| 15 | Condition presets (Diabetes, Hypertension, Ramadan) sit as four tabs on Home | Show only the preset that matches the profile; others under Change plate | M |
| 16 | The right panel repeats Home content on every page | Show it on Home only (desktop) | S |
| 17 | A pulsing weather badge is constant motion | Static icon plus words ("Good for a walk" or "Stay indoors today") | S |
| 18 | Cheap-protein finder and the adaptive-TDEE gauge are buried in Insights | Finder becomes an "Eat well on a budget" card in Plan; the gauge goes under "How we estimate" | M |

## A2. Home (`/home`)

```
┌──────────────────────────────┐
│ Good afternoon       বাং | EN │
│ ┌ Today ────────────────────┐│
│ │  (ring)  about 1,250      ││
│ │          of 1,800 kcal    ││
│ │ You're on track.          ││
│ │ [        Log lunch      ] ││  ← the one action
│ └───────────────────────────┘│
│ Water  ▢▢▢▢▯▯▯▯    [+250 ml] │
│ Rice   1 medium bati · usual │
│ ▸ Today's plate              │
│ ▸ Details and how we work it out │
└──────────────────────────────┘
```

- **Order:** one-line greeting, Today card, Water row, Rice row, then collapsed sections. Nothing else above the fold.
- **Today card:** the ring plus one plain sentence chosen from the engine's state: on track; a bigger day (amber, links to Plan); a lighter day; evening "Rest well, nothing more is needed today". Exactly **one primary button**, labelled from the time and the gaps ("Log lunch", "Add water", "Take a 15-minute walk").
- **Details (collapsed):** calories you use in a day, lowest safe amount, today's goal, each with a one-line "Why?" and a source chip. They stay for people who want them; they are just not first.
- **Plate presets:** show only the one that matches the profile. "Change plate" opens a sheet with the others. The disclaimer is one sentence behind an info icon; tapping expands the full text and the guideline citation.
- **Water:** keep the ripple on +250 ml, add a 5-second Undo toast, and vibrate for 10 ms where supported.
- **Desktop:** the right panel appears on Home only.

## A3. Navigation

- **Mobile bottom bar (5):** Home, Plan, **Log** (raised, centre), Move, Coach. Labels always visible with the icons.
- **More sheet** from the avatar, a list with icons and labels: Progress, Family, Settings, Language, Help.
- Rename **Insights to Progress** (the route can stay `/insights`).
- **Desktop sidebar:** the same two groups with a divider between them.
- **Top bar:** logo, language switch, avatar. The sync pill appears only when offline or when changes are waiting ("Saved on this phone, will sync").
- The active item shows icon, label and colour together, never colour alone.

## A4. Plain language

Bangla strings are suggestions; have a native speaker review them before release.

| Now on screen | Replace with (EN) | Bangla |
|---|---|---|
| Maintenance TDEE | Calories you use in a day | দৈনিক খরচ হওয়া ক্যালরি |
| Safe floor / BMR | Lowest safe amount | সর্বনিম্ন নিরাপদ পরিমাণ |
| Today's target | Today's goal | আজকের লক্ষ্য |
| Rolling deficit / Rebalancer | Spread it over the week | সপ্তাহজুড়ে ভাগ করে নিন |
| Rebalance window | Spread over (days) | কত দিনে ভাগ হবে |
| What-if simulator | Try a meal first | আগে একটু হিসাব করে দেখুন |
| Adaptive TDEE | Our estimate is getting better | আমাদের হিসাব আরও নির্ভুল হচ্ছে |
| Insights | Progress | অগ্রগতি |
| Zero-deficit guardrail | No calorie cut during Ramadan | রমজানে ক্যালরি কমানো নয় |

**Rule:** a word a non-expert would not use in conversation never appears on the main screens. Technical terms may stay inside Details with a one-line explanation.

## A5. Logging (`/log`)

1. Open on the search field with the **meal slot preselected by the clock** (breakfast before 11:00, lunch 11:00 to 16:00, snack 16:00 to 19:00, dinner after).
2. Under the search, a **"Your usual" row of big tap tiles** (64 px minimum, illustration plus Bangla name) for the user's top 8 foods. A new user sees 8 staples: bhat, dal, ruti, dim, alu bhorta, machh, shobji, cha.
3. Tapping a tile adds it with the remembered portion. Portions are three chips (small, usual, large) on the added row, not a slider.
4. A **live total** sits in a sticky bar above the tab bar ("Lunch: about 620 kcal") with a 48 px **Save** button.
5. **Undo toasts replace confirm dialogs** for remove and save.
6. Banglish typing shows fuzzy suggestions with the Bangla spelling beside each.
7. Photo, street food and recipe are secondary icon-and-label buttons under the search.
8. A failed match says: "I couldn't match 'xyz'. Pick the closest:" followed by five options.

## A6. Onboarding (after submission)

- **Three screens:** age and sex; height and weight; how active (three icon choices). About one minute, with progress dots and a Skip on every screen.
- The **safety check stays in the first run** (one screen, four yes/no taps, "A quick safety check") and always comes before any goal is shown.
- Then land on Home with the first day already filled in.
- Ask the rest later as one **"Make it more accurate"** card at a time on Home: division (for weather), rice portion, eating style, health conditions. Conditions are optional, with a line saying why we ask and a Skip.

## A7. Plan (`/plan`)

- The weekly bar chart first.
- One **Your plan** card with a plain sentence ("Friday was bigger. Spread about 150 kcal over the next 4 days"), a primary **Looks good** button and a secondary **Adjust**.
- **Adjust** opens a sheet holding: spread over (3 to 7 days stepper), food and movement split (segmented), preferred exercise. Keep the elastic-band visual inside this sheet because it explains the spread.
- Feast presets become three large buttons: **Biriyani night**, **Wedding dawat**, **Eid feast**.
- "Try a meal first" is a link on the plan card that opens the what-if slider in a sheet.
- A card **Eat well on a budget** links to the cheap-protein finder.

## A8. Activity (`/activity`)

- A **Right now** card first: one suggestion computed from weather, air quality, prayer window and the user's mode ("Good evening for a 15-minute walk after Maghrib") with a **Start** button and an "Another idea" link.
- Weather is one line: icon plus words. No pulsing.
- Prayer times are a horizontal chip row with the current window highlighted.
- Routines, the 10 to 30 minute progression, the activity pyramid and the 150-minute gauge become **collapsed accordion sections**.
- "Home workouts only" is a filter chip, not a header badge.

## A9. Progress (`/insights`)

- Weight chart: the 7-day trend is the thick primary line, raw weigh-ins are small dots.
- The weigh-in form offers tag chips inline (Eid feast, salty meal, period, travel, ill). The reassurance text appears only when a tag is chosen.
- The adaptive estimate lives under a **"How we estimate"** accordion with one sentence ("Our estimate is getting better: day 8 of 14").

## A10. Numbers and type

- **Headline** "about 1,250" at 32 to 40 px (Bengali digits when the language is Bangla) with a caption "range 1,150 to 1,350" at 14 px. In lists show "about 385"; the range is one tap away in the item detail. Ranges are never hidden, just second.
- **One family for numbers**, with `font-variant-numeric: tabular-nums`. No monospace face.
- **Sizes:** body 16 px (Bangla 17), captions never below 14 px (Bangla 15), nothing below 12 px anywhere, Bangla line-height at least 1.65.
- Units always shown: "kcal", "ml", "g" in English; "ক্যালরি", "মি.লি.", "গ্রাম" in Bangla.

## A11. Colour means something (replace the seven-hue palette)

Use these values now. The Part B tokens replace them after submission.

| Role | Fill and icon | Text-safe shade | Used for |
|---|---|---|---|
| Brand and action | `#4F46E5` (white text 6.3:1) | `#4338CA` | Buttons, links, active nav |
| Good, balanced, goal met | `#10B981` | `#047857` | Balanced plate, hydration met |
| Gentle caution | `#F59E0B` on tint `#FFF7E6` | `#B45309` | A bigger day, near the cap |
| Water and weather info | `#0EA5E9` | `#0369A1` | Water, weather, air quality |
| Error only | `#F43F5E` | `#BE123C` | Form errors. **Never for calories** |

- Remove rose and lilac as a "modesty" theme; they carry no meaning.
- Warm neutrals. Light: background `#FAF8F5`, card `#FFFFFF`, border `#E4DFD8`, ink `#1F1B16`, soft ink `#5E574E`. Dark: background `#12100E`, card `#1C1916`, border `#37312B`, ink `#F3EFE9`, soft ink `#B5ACA0`.
- Cards are flat with a visible 1px border. No neumorphic inner glows.
- White text only on 600-level or darker fills. Colour is never the only signal. Check each text and background pair for AA.

## A12. Motion and feedback

- **Keep:** the water ripple, the elastic rebalance band, and the calorie ring filling once when Home loads.
- **Remove:** constant pulses and any motion nobody triggered.
- Every tap shows a pressed state within 100 ms. Saves show a toast with Undo. Loading uses skeletons. Reduced motion is respected.

## A13. Trust and help

- A **Why?** icon beside every recommendation opens a popover with one sentence and a source chip.
- Disclaimers are one sentence behind an info icon; the full text lives in About.
- The default language follows the browser locale (`bn` gives Bangla); the language switch stays in the top bar.
- First-run coach marks: three at most, each dismissible, never repeated.
- **Help** in More: five FAQs ("How do I log rice?", "What does 'about' mean?" and so on).

## A14. Touch and readability

- Primary buttons are 48 px high and full width on mobile, in a sticky bar above the tab bar (thumb zone). Other tap targets are at least 44 px with at least 8 px between them.
- No hover-only features.
- Inputs use the right `inputmode` (numeric for height and weight) and keep their values after an error.
- Test at maximum screen brightness in direct light, and at the large-text setting: the layout must reflow, not clip.

## A15. Ship order

If today is the submission day, do only the first group.

- **Now (copy, structure, CSS; about 2 hours):** A1 items 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 17.
- **Next (a few hours):** items 1, 11, 12, 13, 15, 18.
- **After submission:** item 14, the Progress changes (A9) and the Part B token migration.

## A16. Part A acceptance

- [ ] The four tests in A0 pass with at least one real person
- [ ] `/home` shows one primary action above the fold at 360 px, in Bangla and English
- [ ] No TDEE, BMR, deficit, rebalance or simulator wording on the main screens
- [ ] Insights and Family are reachable on a phone in two taps
- [ ] No red or rose anywhere for calories; every accent used as text passes AA
- [ ] No monospace face; Bengali digits render in the same font as the text around them
- [ ] Every estimate shows "about" first with the range one tap away
- [ ] No Buildathon badge, no constant pulse, no header badge for Home workouts only
- [ ] Each changed screen was checked with ui-ux-pro-max and logged in `docs/skills-log.md`; `/ponytail-review` ran before the commit

---

# Part B: Full visual redesign spec (adopt after submission)

## 0. Your role and the job

You are the lead frontend engineer and designer for **Deshi Health Companion**, a Bangladesh-first calorie, diet and exercise-balancing web app (installable PWA) with a RAG-grounded AI coach. It is built for the Ostad YUNet AIgnite Buildathon 2026. Submission is **November 5, 2026**, so `main` must stay demoable at all times.

**Stack:** Next.js 16 (App Router), Tailwind 4, Convex, Groq, Vercel.

**Task:** implement the complete UI for every page, the shared shell and every component below. Build against typed fixtures first (`lib/mock/`), so Convex queries can be swapped in later without changing components. Backend and engine work happen in parallel in `lib/engine/`.

### Hard rules that come from the product, not from taste

1. **The UI never invents numbers.** Calories, floors, caps, exercise minutes and grams come only from `lib/engine/` or a tool result. Components receive numbers as props and only format them.
2. **Every estimate shows its uncertainty:** use `<Range>` ("620 to 780 kcal") or an "about" prefix, plus a `<SourceTag>` (FCTB, estimated-recipe, user-entered, AI-assisted).
3. **Shame-free copy.** Never "you failed", "cheat day", "burn off your binge", "bad food", or red alarm styling for an over-day. An over-day is a calm amber note followed by a gentle plan.
4. **Safety modes change the UI.** `safetyMode()` returns `normal`, `restricted` or `doctor-first`. In `restricted`, deficit controls and the rebalance planner are hidden. In `doctor-first`, no calorie target, deficit or weight-loss pace is shown, only a calm referral card.
5. **Privacy.** Name, age, weight and conditions are shown locally only and never put into anything sent to the LLM.
6. **Bangla is first-class.** Every screen works in Bangla, English and mixed use, with Bangla numerals when the language is Bangla.
7. **No remote images or hotlinks.** Local assets, inline SVG and generated illustrations only (offline and data-saver depend on it).
8. **No weight-loss promises anywhere** ("lose X in Y days" is never used; use neutral rhythm wording such as "Day 21 of your 28-day plan").

---

## 1. The design language (a mix of five dashboard styles, described in words)

The look is a **soft, rounded, lavender-and-violet health dashboard**: floating rounded frames, big pill shapes, pastel tinted tiles, one violet hero card, one coral accent card, and a strict 8pt grid. **Spend the boldness in two places only:** the violet hero card (the only gradient in the app) and the `PlateBalance` illustration, which is the app's signature. Draw `PlateBalance` as a top-down Bangladeshi thali (a mound of rice, a bati of dal, a fish or egg piece, a bhaji, a lemon wedge) whose segments carry the balance data, and reuse that drawing style in the login collage and in empty states. Everything else stays quiet and flat. Sections 2 and 3 describe the five signature patterns in detail. Section 4 puts them together into pages.

### 1.1 Colour tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `--page` | `#B9BEDD` | `#0E0C18` | Browser backdrop behind the app frame (desktop only) |
| `--canvas` | `#EEEDF5` | `#14121F` | App background inside the frame |
| `--surface` | `#FFFFFF` | `#1D1A2C` | Cards |
| `--surface-soft` | `#F4F3F9` | `#25223A` | Inputs, inner tiles, inset stat wells |
| `--ink` | `#1E1A2E` | `#F1EFF8` | Primary text |
| `--ink-soft` | `#625E75` | `#A9A5BE` | Secondary text, labels (AA on both canvas and surface) |
| `--line` | `#E3E1EC` | `#34304A` | Dividers, outlines |
| `--violet-600` | `#5B3E9E` | `#B3A0F0` | Violet as text, icon, link and chart stroke |
| `--action` | `#5B3E9E` | `#6A4CC0` | Fill of every primary button, active nav item and the Log button (white text passes AA in both modes). One action colour for the whole app |
| `--violet-500` | `#6E57C4` | `#7A62CE` | Hero gradient start |
| `--violet-700` | `#4A3590` | `#3B2A78` | Hero gradient end and the solid rail |
| `--blue` | `#2F62F0` | `#6C93FF` | Second chart series and the selected-tile icon holder only. Never a button or nav colour |
| `--coral-500` | `#CF3A66` | `#CF3A66` | Highlighted data point (same in dark mode) |
| `--coral-600` | `#B22C58` | `#B22C58` | Solid fill of the coral card (white text on it passes AA, so it stays the same in dark mode) |
| `--leaf` | `#2F8F67` | `#59C596` | Balanced, success, progress bar fill (`#35C26B` for bars). Icon and fill only; text on a leaf tint is `--ink` |
| `--turmeric` | `#E9A23B` | `#F5BC62` | Gentle caution, near the cap (never red for calories). Icon and 1px border only; text on its tint (`#FFF3DC`, dark `#3A2E14`) is `--ink` |
| `--rose` | `#C2415D` | `#F07A92` | Form errors only |

Pastel tiles, each with a darker same-hue icon colour and a dark-mode variant:
`mint #E4F6EC / icon #2F8F67`, `lilac #ECE6FA / icon #6A4CC0`, `peach #FDEBDD / icon #D9772B`. Three tints only; no sky blue, so blue stays a data colour.

Rules: text contrast at least AA; colour is never the only signal (pair with an icon or label); no pure red for calorie states.

### 1.2 Typography

- **Latin:** Manrope. **Bangla:** Hind Siliguri, fallback Noto Sans Bengali. Load with `next/font`, subset, `display: swap`. Stack: `var(--font-latin), var(--font-bangla), system-ui, sans-serif`.
- Scale (px): 12, 14, 16, 20, 24, 28, 32, 40. Weights 400, 500, 700, 800 (800 only for big stat numbers).
- Bangla: line-height 1.65 (Latin 1.4), body about 1px larger than Latin. Verify conjuncts are not clipped in chips, tabs and buttons.
- Page title 32/40 bold. Section label 16 bold, plain (no dots, no eyebrow labels above titles). Card title 14 to 16 bold. Labels 12 to 14 in `--ink-soft`. Stat numbers 28 to 40 bold with tabular figures.
- A big light-weight (400) page headline of 40px is allowed on `/activity` only.
- **Verify the fonts before locking them:** render a test row with Bangla and Latin digits in Manrope + Hind Siliguri. If numerals mismatch in weight or height, switch to **Anek Bangla + Anek Latin** (one family designed for both scripts, variable weight and width; confirm it is available in `next/font/google`) and use its width axis for the big stat numbers.
- Numbers go through `lib/format.ts` (`formatNumber`, `formatRange`, `formatKcal`) using `Intl.NumberFormat('bn-BD')` in Bangla. Never format numbers inline.

### 1.3 Spacing, radius, elevation

- **8pt grid:** every gap, padding and size is a multiple of 8 (8, 16, 24, 32, 40, 48, 56, 64); 4 is allowed only for tight icon gaps.
- Radii: app frame 32, hero card 28, card 24, tile 16, chip/button/input/search fully pill (999px).
- Card padding 24 (16 on mobile). Gap between cards 16 (24 on desktop).
- Shadows: card `0 8px 24px rgb(60 40 120 / 0.08)`; floating frame `0 24px 64px rgb(60 40 120 / 0.18)`; inset well `inset 0 2px 6px rgb(60 40 120 / 0.08)` (used inside stat tiles). Dark mode swaps shadows for a 1px `--line` border and a faint glow. **Only the hero card, floating callouts, sheets and the raised Log button carry a shadow.** Ordinary cards are flat (`--surface` on `--canvas`, at most a 1px `--line` border) so that elevation signals hierarchy.
- **One gradient only:** the violet hero card (`linear-gradient(135deg, violet-500, violet-700)`). The rail is solid `--violet-700`, the coral card is solid `--coral-600`, the gauge arc is solid `--action`, and no button has a gradient.

### 1.4 Motion

- One unprompted moment: on first load of `/home`, the calorie ring fills and the area chart line draws in (700 ms, ease-out).
- Everything else is a response to user action: tab underline slide, sheet open, chip select, slider drag, toast in/out, a small "added" check after saving a meal.
- Honour `prefers-reduced-motion` (instant state changes).

---

## 2. Signature patterns (fully specified)

Each pattern is a reusable layout recipe. Implement them as components, then compose pages from them.

### Pattern 1: Floating frame with a violet rail and a violet hero card

**Frame (desktop only, 1024 px and up).** The page backdrop is `--page`. In the centre sits the app frame: max width 1440, margin 32, radius 32, a 1px white-40% border plus a 12px translucent outer ring (white 35%), floating shadow. Inside is a `--canvas` panel with 24px padding. Below 1024 px the frame disappears and the app is edge to edge.

**Rail.** A vertical pill 72px wide, full height of the frame minus 24px margin on each side, radius 36, solid `--violet-700` background. From top to bottom: a bell icon button; a hairline divider (white 20%); icons Home, Log (document), Plan (bar chart), Activity (line chart), Coach (play/chat), each 24px, white at 70% opacity; the **active icon sits in a 44px rounded-square (radius 14) with white 20% fill** and full white icon; a flexible spacer; a hairline divider; the **light/dark toggle**; a logout icon. Tooltips show the label on hover and on keyboard focus.

**Page header.** The page title 20 to 32 bold on the left, with no breadcrumb or eyebrow label above it. On the right: a search pill 240x44 (`--surface-soft`, search icon left, placeholder "Search foods"), then a 44px circular avatar.

**Hero "Overview" card (the star of the dashboard).** Radius 28, violet gradient, padding 24, text white.
- Top row: title "Overview" 16 bold on the left; on the right an outlined pill selector (white 40% border, 32px high visually, 44px hit area) reading "Weekly" with a chevron.
- Chart area (160px high): a smooth cubic-curve **area chart**. Line is `--coral-500`, 3px, rounded caps. Fill is a vertical gradient from coral 35% down to transparent. One **highlighted point**: a 16px coral circle with a 3px white ring; behind it a translucent white-12% vertical column (36px wide, radius 18) running full chart height; above it a dark tooltip chip (`#2B2350`, radius 12, padding 8x12) with the value in white 14 bold and a unit label in white 85% 12px.
- Under the chart: a row of period labels (12px, white 85%); the active label sits in a white pill with violet text.
- **Notched stat strip** at the bottom: a lighter violet band (white 8%) with three stats side by side. The **middle stat is raised**: the band curves up around it as a rounded notch (draw with an SVG path or two radius cut-outs), and that centre value is larger (32 bold) while the outer two are 24 bold. Each stat is value on top, small caption below (white 90%). Example content: left "Eaten", centre "Today", right "Guide".

**Side accent cards** (stacked, right of the hero, each about 1/3 of the hero's width):
1. Violet card (`--violet-600`, radius 24): a 56px rounded-square icon holder (white 20%) with an icon on the left, title "Daily walk" 16 bold white.
2. Coral card (solid `--coral-600`, radius 24): same icon holder, title "Today's movement", below it a caption "Total time" (white 90%), the value "48 min" at 32 bold white, a faint area chart in the background (white 20% line), and a 40px circular white button with a right-arrow in the bottom right.

**Goal cards row** (three cards, white, radius 24, padding 24, flat (no shadow), evenly split under the hero). Each: a **56px round violet icon button that overlaps the top edge of the card by half**, a three-dots menu icon top right, centred title 16 bold, centred grey subtitle (e.g. "150 min / week"), then a labelled progress bar: left label "Progress", right label percent (e.g. "45%"), a 6px-high track (`--surface-soft`) with a `#35C26B` fill with fully rounded ends, then a row with a grey fraction ("68 / 150 min") on the left and a calm lilac pill ("3 of 7 days", background `#ECE6FA`, text `--violet-600`) on the right. Never a countdown or "days left" wording; that creates pressure.

**Right panel** (desktop, 320px wide, white, radius 24, left border of the frame): a header with a small icon and title ("Household") and a "View all" link; a **segmented control** (`--surface-soft` track, active segment solid `--action` with white text, radius 999, 44px high) with two segments; a list of rows (avatar 40px circle, name 14 bold, caption 12 grey, trailing envelope or check icon in a rounded-square button, 16px between rows); then a compact card at the bottom with a header ("Today's air and heat") and a small illustrated tile instead of a map (see 4.3).

### Pattern 2: Labelled sidebar, greeting header and stacked info panels

Used on desktop from 1280 px to replace the rail with a **labelled sidebar**.

**Sidebar.** 232px wide, `--surface-soft` panel with radius 24, padding 16. Top: a 40px rounded-square violet (`--action`) logo tile with a white plus mark and the app name 24 bold beside it. Menu items are 44px tall, radius 12, icon 20px + label 14 medium, 12px gap, `--ink-soft` text. The **active item is a solid `--action` pill with white icon and text**. Items: Home, Log, Plan, Coach, Activity, Insights, Settings. At the bottom a promo-style card (white, radius 16, padding 16): titled **"Share with a dietitian"** 14 bold, a 56px round illustration, a one-line caption ("Export your week as a PDF") and a full-width grey button **"Export PDF"**. Render this card only once the PDF export works (Wave 6); until then leave the slot empty. Never ship a button that does nothing.

**Greeting header.** Left: "Hello, {name} 👋" at 24 bold; below it 14 grey "Here's your update for today." Right: a **solid `--action` pill button** 44px high (white text with a small plus icon) labelled "Log a meal", then two circular 40px icon buttons (chat, bell with a small dot) and the avatar.

**Centre visual with floating callout.** A large area (about 40% of the content width) holds a visual, with a **floating white callout card** (radius 16, padding 12, soft shadow, icon in a small coloured circle, label 12 grey, value 14 bold) attached by a thin line to a dot on the visual. Under the visual a row of three 72px thumbnails (radius 16, one selected with a blue 2px outline). In this app the visual is the **plate-balance illustration** (see Components), callout "Vegetables 32%", and thumbnails switch between "Today", "This week" and "Rice".

**Right stack of panels** (each white, radius 16, padding 16, gap 16):
- **Range bar chart** titled "Overview": legend of two dots (violet and blue) top left, small icons top right; 7 vertical columns, each a rounded bar split into a violet segment (bottom) and a blue segment (middle), with the y-axis ticks in grey (0 to 100) and day labels (Sa Su Mo Tu We Th Fr).
- **Upcoming / next-up card**: avatar and name, a caption, a full-width **solid `--action` button** with an icon ("Join video call" becomes **"Start a 15-minute walk"**), and a full-width grey button below ("Reschedule" becomes **"Move to evening"**).
- **Recent list card** with a "See all" outlined pill on the right of the title and horizontal chips, each chip: 40px tinted icon square, a name 12 bold, a caption 12 grey, and a small status badge in the top right (violet "Scheduled" or mint "Completed") with a 999px radius.
- **Key-values list**: rows with a 36px tinted icon square, a label 14, and a bold value with a unit (e.g. "Water 1.6 L", "Fibre 18 g").

### Pattern 3: 8pt grid board with a light icon rail, inset stat wells and section dots

Used for **mobile and tablet** shells and for the stat tiles everywhere.

**Light icon rail (optional variant; the default tablet rail is the violet rail from Pattern 1, so build this one only in Tier C).** On the left, a column of 44px white circular buttons spaced 16px, on a `--canvas` background with a hairline divider after the first group; the **active button is solid `--action` with a white icon**. At the bottom two small buttons: a "gauge" (accessibility/text size) and a sun/moon theme toggle. At the top a 48px white circle logo.

**Top bar.** Search pill (max 320px) with a round white 36px search button at its right end; a white circular bell with a small red dot (`--rose`); a 44px circular avatar.

**Hierarchy.** Page title 28 to 32 bold at the left. Under it, plain 16 bold section labels ("Today", "This week"), no dots. The content order always runs: title, section label, cards, then secondary sections.

**Stat tile (inset-well style).** A white card, radius 20, padding 16. Header row: a 36px rounded-square icon holder (grey-white, or **solid blue with a white icon when the tile is active/selected**), then a tiny grey label (12) above a bold value (14 to 16). Below it a **grey inset well** (`--surface-soft`, radius 14, height 72, inset shadow) containing a mini visual:
- *ticks well:* thin vertical grey ticks of varying height with a blue tick as the current marker;
- *wave well:* a thin blue line wave (ECG-like squiggle) drawn as an SVG path;
- *flat well:* a faint flat grey wave.
On the right inside the well sits a **small solid `--action` rectangle (radius 8) with white text** showing the main value and, below it, the unit in a smaller size. Tiles form a 2 x 2 grid on mobile and 4 across on desktop.

**Daily series chart.** A white card, radius 20, with a big centred average number (32 bold, e.g. "92") and a caption "Avg" below it, a y-axis in light grey, hour or day labels along the bottom in light grey, and **floating vertical pill bars** (6px wide, rounded ends, mixed violet for in-range and light grey for the rest, with some bars showing a blue and a grey pill stacked with a gap).

**Schedule card.** White, radius 20: a top row with a small rounded-square icon and "Next check-in" caption plus the date bold; a date stepper pill (`--surface-soft`, left/right arrow buttons, date text centred); a vertical list of rows (36px round avatar, name 14); a **full-width `--action` pill button with a trailing arrow icon** ("Consult now" becomes **"Open plan"**).

### Pattern 4: Tabbed exercise page with timer chip, segmented progress, pastel tiles and a semicircle gauge

Used for `/activity`. This page sits inside a white card, radius 24, on a very light blue page tint (`#E8F1FD` light, `#16203A` dark) when on desktop.

**Sidebar for this page style (200px).** A small logo plus name at the top, a grey "Menu" label (12), items with an icon and a label (14), active item has a faint lilac background. A "Scheduled events" section with small coloured ring bullets (violet, coral, blue) and plain event names. A user chip with avatar, name and a chevron at the bottom.

**Top tabs.** A row of text tabs, 14px, underline style, active tab in `--ink` with a 2px `--ink` underline and inactive in `--ink-soft`. Tabs: **Exercise, Food plan, Daily habits, Water intake**. The tab row scrolls horizontally when Bangla labels do not fit; never wrap or truncate them. A bell, a user icon and the avatar sit at the far right.

**Headline block.** A 40px regular-weight title ("Today's movement") with a grey "Day 21" below. Two ghost circular arrow buttons (prev/next) at the right of the title row, faint and soft-shadowed.

**Exercise hero.** Left: a **circular timer chip**, 48px diameter, a 4px violet ring segment on a light-lilac track with the time in the centre ("4:35", 12 bold). Next to it: the activity name 16 bold ("Brisk walk") and a grey line ("3 x 10 minutes"). Centre: a large clean line illustration of the activity (about 360 x 220), rendered as inline SVG, soft grey ground shadow beneath it. Under the illustration: **five segmented progress bars**, equal width, 4px high, 8px gaps, filled violet up to the current step and light grey after.

**"Next" row.** A 20px bold "Next" heading, then three cards in a row (no border, light shadow, radius 16): small illustration on top, name 14 bold, duration 12 grey.

**Right column.**
- A **2 x 3 grid of pastel quick tiles** (each 104 x 96, radius 16, tinted mint, lilac, peach, mint, lilac, peach): a 28px icon in the darker hue at top left and a two-line 12px label under it. Content: Wake-up routine, Sleep schedule, Healthy diet, Habit tracker, Water plan, Tips.
- A **goal card** with a heading ("Weekly active minutes") 14 centred, a **semicircle gauge** (arc 12px thick, solid `--action` for done and light grey for remaining, a small circular marker at the arc's end with a tiny icon inside), and centred below it big numbers "90 min" with a lighter "/ 150" next to it.
- A **success toast** card (mint background `#E1F7EC`, radius 12, padding 12, check-circle icon in `--leaf`, text 12 in `--ink`): "Good work, you are on track this week."

### Pattern 5: Split login card

On a warm grey page (`#D6D5D0`; dark `#1A1820`), a centred white card (max 1032 x 704, radius 40, padding 24 to 32, no heavy shadow).

- **Left panel:** an image area, 45% of the card width, radius 24, soft grey-beige background (`#C9C5BC`) holding a **botanical collage illustration** of Bangladeshi produce (green leaves, a white flower with a yellow centre, rice stalks, a lentil bowl, a chili, a hilsa fish silhouette) drawn as a local SVG or optimised WebP. Hidden below 768px.
- **Right panel (form):** centred column, max 424px. Logo mark (a black flower/star glyph, 32px) with the app name 16 bold to its right. Title "Login to your account" 28 bold centred. Subtitle 14 `--ink-soft` centred ("Welcome back! Enter your details to log in to your account.").
- Field label 14 `--ink-soft`. **Pill inputs:** height 48, radius 999, 1px `--line` border, padding 0 20px, placeholder 14 ink at 60%, focus shows a 2px violet ring.
- Row: a 16px rounded-square checkbox + "Remember login" (12 grey) on the left, "Forgot password?" underlined 12 violet on the right.
- **Primary button:** full width, 48 high, `--violet-600`, white 16 bold text, radius 999.
- Divider: thin lines either side of "Or continue with" (12 grey).
- **One social button (Google):** full width, 48 high, `--surface-soft`, radius 999, Google glyph + "Sign in with Google" 14 bold. (No Apple button.)
- Footer 12 grey: "New here? **Create account**" with the link in violet bold.

---

## 3. Shared components to build first (`components/`)

Demo every component on a hidden `/_dev/components` route.

**Shell**
- `AppFrame` (Pattern 1 frame on desktop, edge to edge on mobile) with the three navigation modes: `BottomTabs` (mobile), `NavRail` (tablet, Pattern 1 violet rail or Pattern 3 light rail, pick the violet rail as default), `SideNav` (xl desktop, Pattern 2). One nav source in `lib/nav.ts`.
- `TopBar` (title, search, language switch বাংলা/EN, bell, avatar menu), `RightPanel`, `OfflineBanner`, `SyncStatusPill`, `SafetyBanner`.
- **Mobile bottom tab bar:** white, radius 24 top corners, height 64 plus safe area, 5 items (Home, Plan, **Log raised centre**, Coach, Activity). The Log button is a 56px violet circle lifted 16px above the bar with a plus icon and a soft violet shadow.

**Data display:** `HeroCard`, `StatTile`, `PastelTile`, `GoalCard`, `CalorieRing`, `SemiGauge`, `AreaChart`, `BarRangeChart`, `SegmentedProgress`, `Sparkline`, `PlateBalance`, `Range`, `SourceTag`, `MicronutrientRange`, `Num`. All charts, rings and gauges are **hand-written SVG** (no chart library) to keep the bundle light for low-end phones; every chart has a visually hidden data table for accessibility.

`PlateBalance`: a top-down circular plate (diameter 200, soft shadow ring) divided into four coloured segments (vegetables `--leaf`, protein `--coral-500`, grains `--turmeric`, other `--violet-500`), with segment arc sizes driven by props, a centre label, and tap targets that update the callout. Style it as the thali described in section 1.

**Inputs and feedback:** `Button` (primary violet, secondary grey, ghost, danger-soft), `PillInput`, `Field` (label, hint, error), `Select`, `Chip`, `TabBar` (Pattern 4 underline style), `SegmentedControl` (Pattern 1 style), `Slider` (for the 60/40 split), `Toggle`, `StepperInput`, `Sheet` (bottom sheet on mobile, right drawer on desktop), `Toast`, `Skeleton`, `EmptyState`, `ConfirmDialog`.

**Chat:** `ChatBubble`, `CitationChip` (shows guideline section and page, opens a source drawer), `ToolNumber` (visually tags a number that came from the engine or a tool), `RefusalCard`.

All interactive elements: 44px minimum touch target, visible 2px focus ring, accessible names in both languages.

---

## 4. Pages (build every one)

Routes: `/login /signup /onboarding /home /log /plan /coach /activity /settings`, plus later-wave stubs (section 5). Every page uses the shell from section 3 and the patterns from section 2.

### 4.1 `/login` and `/signup`: Pattern 5

- Login exactly as Pattern 5. Signup uses the same card with name, email, password and a consent checkbox linking to the privacy page. No weight, age or conditions here.
- States: field errors under inputs in plain language, a spinner inside the button while submitting, language switch top right of the card.

```
+------------------------------------------------------------+
| +----------------+   [logo] Deshi Health                   |
| |   botanical    |        Login to your account            |
| |   collage      |     Welcome back! Enter your details    |
| |   (rounded)    |   Email    (_________________________)  |
| |                |   Password (_________________________)  |
| |                |   [ ] Remember login     Forgot password?|
| |                |   [          Login (violet)           ] |
| |                |   ------- Or continue with -------      |
| +----------------+   [     G  Sign in with Google        ] |
|                         New here? Create account            |
+------------------------------------------------------------+
```

### 4.2 `/onboarding`: wizard

One question group per step, large type, pill inputs, a **segmented progress bar** (Pattern 4 style, one segment per step) at the top, Back and Next always visible, progress saved after every step.

Steps: 1) language and text size; 2) consent, data use, "delete my data" explained in two lines, disclaimer; 3) profile (age, sex, height, weight, activity); 4) body measures with **Asian BMI (23 / 27.5)**, waist and waist-to-height ratio shown in a Pattern 3 stat tile with neutral wording; 5) goal and pace (maintain, gentle change, build strength; pace appears only in `normal` mode); 6) safety screening, one question per screen, result may switch to `restricted` or `doctor-first` with a calm explanation card and referral copy slot; 7) eating style (rice-heavy, roti-heavy, vegetarian, no-beef, halal-only, fasting habits); 8) budget band in taka and household (who cooks, how many eat from the pot, meals out); 9) daily routine (prayer times, commute); 10) summary "Here is your starting point" with ranges and a "Looks right" primary button.

Doctor-first outcome: skip step 5 and the targets in step 10, show a referral card, and still allow food logging without targets.

### 4.3 `/home`: Patterns 1, 2 and 3 mixed

Desktop (rail or sidebar, centre, right panel):

```
+----+---------------------------------------------+-----------+
|rail| Home                     [search]      (av) | Household |
|    | Hello, Moballig 👋   [ Log a meal ]         | [Meals|Fam]|
|    | +-------------------------+ +-------------+ | row row   |
|    | | OVERVIEW  [Weekly v]    | | Daily walk  | | row row   |
|    | |  area chart + tooltip   | +-------------+ | row       |
|    | |  Eaten | TODAY | Guide  | | Today's move| | ---------- |
|    | +-------------------------+ |  48 min  (>)| | Air + heat |
|    | [stat][stat][stat][stat]    +-------------+ |  card      |
|    | [PlateBalance + callout] [goal][goal][goal] |           |
+----+---------------------------------------------+-----------+
```

- **Hero card (Pattern 1):** "Overview" with a Day / Week selector. Chart shows 7 days of calories eaten against the guide band, the current day highlighted with the tooltip. The notched strip shows **Eaten | Today (centre, bigger, the `CalorieRing` summary as a range) | Guide**. In `restricted` and `doctor-first` modes the Guide stat and guide band are removed (see section 6).
- **Side accent cards (Pattern 1):** "Daily walk" (violet), "Today's movement" (coral, minutes today, arrow button to `/activity`).
- **Stat tiles (Pattern 3):** Rice portion ("about 1.5 bati", ticks well), Water (flat well), Steps (wave well), Fibre (ticks well). The selected tile turns its icon holder solid blue.
- **Plate balance block (Pattern 2):** `PlateBalance` with a floating callout, three thumbnails (Today, This week, Rice), a one-line "why" caption, and micronutrient ranges as small chips (iron, vitamin A, calcium, zinc, D, B12).
- **Goal cards (Pattern 1):** three `GoalCard`s such as "Balanced plates this week", "Veg servings", "Water days".
- **One next action:** a single solid `--action` button inside the right stack ("Log lunch" or "Take a 15-minute walk after dinner"). Never more than one.
- **Right panel (Pattern 1):** segmented control **Meals | Household**. *Meals*: rows for today's breakfast, lunch, snack, dinner with kcal range and an edit button. *Household*: family members who eat from the pot (family mode) with portion notes. Under the list a small **"Air and heat today"** card: temperature and AQI in two rounded chips, a short suggestion ("Good evening for a walk" / "Indoors today"), no map.
- **Overshoot day:** an amber card (background `#FFF3DC`, `--turmeric` icon and 1px border, text in `--ink`) "A bigger day than planned. Here is a gentle way to spread it" with a button to `/plan`.
- **Mobile:** stack as hero card, then 2 x 2 stat tiles, plate balance, goal cards in a horizontal snap scroller, then Meals/Household in a segmented section.

### 4.4 `/log`

```
+--------------------------------------------------+
| Log a meal                                       |
| (  Type in Bangla, English or Banglish...  )  mic cam barcode |
| Breakfast | Lunch | Snacks | Dinner   (underline tabs)       |
| [Recents] [Favourites] [Same as yesterday] [Copy a meal]     |
| ---- candidates (top 5) ------------------------------------ |
|  [icon] Bhat (cooked rice)   1.5 bati   ~280 kcal  [FCTB]    |
|  ...                                                         |
+--------------------------------------------------+
```

- Large pill search input, placeholder "Type in Bangla, English or Banglish (e.g. bhat dal alu bhorta)". Mic hidden if `bn-BD` recognition is unsupported.
- **Parse result sheet:** top 5 candidates as selectable rows (name in Bangla and English, portion text, kcal range, `SourceTag`), a tap-to-pick list on failure. Portion controls: household measure chips (bati S/M/L, spoon, glass, ladle) and plate-fraction chips (1/4, 1/2, 3/4, full).
- **Confirm screen:** items with grams and kcal range, edit portion, remove, "Report wrong calories", a full-width violet **Save to {meal}** button; a green check animation confirms.
- **Shared-pot toggle:** fraction of the pot or spoons from the pot.
- Sub-routes: `/log/photo` (capture or upload up to 3 images, "Reading your plate..." skeleton, result with relative portion chips, plate preset used, kcal range, "AI-assisted estimate" label, edit before save), `/log/rice` (rice calibrator: pick plate and bowl, 100/150/200/300 g visual cards, rice type chips, "Save as my usual rice"), `/log/recipe` (home-cooked recipe builder: ingredients, oil, servings, cooking method), `/log/street` (street-food and restaurant presets with ranges).

### 4.5 `/plan`: Patterns 2, 3 and 4 mixed

- Header "This week" with a date-range stepper pill (Pattern 3 schedule stepper).
- **Range bar chart (Pattern 2):** one bar per day, a light guide band behind the bars, today highlighted, legend "Eaten" (violet) and "Spread plan" (blue).
- **Semicircle gauge (Pattern 4):** weekly used against weekly budget, centred numbers "9,800 / 12,600 kcal" shown as a range.
- **Spread plan card** (only in `normal` mode): plain-language summary of the overshoot and how it is spread; **60/40 split slider** with a live preview; controls for window length, preferred exercise and days off; floor and caps shown as read-only notes; the arithmetic shown with a ± range in Bangla and English.
- **Planned-feast mode** toggle with a date picker (Eid, weddings).
- **What-if / Reverse** as two underline tabs inside one card.
- **Adaptive TDEE** note with honest states ("Estimate improving, 3 of 14 days") and a weight-trend chart (Pattern 3 daily series style) with noise-note markers (Eid, illness, travel).
- `restricted`: hide the spread plan and show maintenance guidance. `doctor-first`: only the referral card.

### 4.6 `/coach`

- Mobile: full-screen chat. Desktop: conversation on the left, a source drawer on the right.
- `ChatBubble`: radius 24 (the corner nearest the speaker is radius 8), user bubbles `--violet-600` with white text, coach bubbles `--surface-soft`.
- Suggestion chips above the input ("What can I eat for iftar?", "Cheap protein under 100 taka").
- After a grounded answer: `CitationChip`s (section and page) that open the source drawer; engine numbers are wrapped in `ToolNumber`.
- `RefusalCard` for unsafe prompts: soft lilac card, text "I can't help with that, but here is a safer idea" plus a suggested action; never styled as an error. Low-confidence retrieval: "I could not find this in the guidelines" with a suggestion to ask a dietitian.
- Streaming text with a typing indicator, a stop button, a retry on failure, and a "Why this?" expandable line on every recommendation.
- In-chat cards: meal suggestion (fits remaining budget, cost band, season), smart swap with local alternatives, cheap-protein table.
- Input bar sticky above the bottom tabs: text, mic, send (violet circle).

### 4.7 `/activity`: Pattern 4

Compose the page exactly as Pattern 4:

```
+--------------------------------------------------------------------+
| Exercise | Food plan | Daily habits | Water intake            (bell)(av)|
| Today's movement                       < >         [2x3 pastel tiles]|
| Day 21                                                              |
| (4:35) Brisk walk                       [illustration]   [semicircle |
|  3 x 10 minutes                                           gauge]    |
| ▬▬ ▬▬ ▬▬ ▱▱ ▱▱  (segmented progress)                   [mint toast] |
| Next:  [Stretch] [Yoga] [Balcony steps]                             |
+--------------------------------------------------------------------+
```

- Tabs: Exercise (default), Food plan (summary linking to `/plan`), Daily habits, Water intake (simple trackers).
- Quick tiles open a **MET-based logging sheet** (Walk, Cycle, Home workout, Cricket or football, Yoga, Chores) showing net calories as a range.
- Also: manual steps entry (web substitute for step import), a **context banner** for heat, rain, air quality, load-shedding and daylight that switches suggestions to indoor options, prayer-time and Ramadan slots, a women-friendly privacy mode badge (home-only plans, no leaderboard), and filter chips for no-equipment plans (rooftop, balcony, room, low-noise).

### 4.8 `/settings`

Grouped white cards (Pattern 3 hierarchy): Profile, Eating style and budget, Household, Daily routine, Language and text size, Appearance (light, dark, large text, low-literacy mode with icons), Data saver, Notifications, **Privacy and data** (consent, export, **Delete my data** with a typed confirmation and a clear result message), Offline and sync status, About, sources and dataset licences, Report a problem.

---

## 5. Later-wave routes (create the route, layout and empty state now)

| Route | Content |
|---|---|
| `/ramadan` | Iftar and sehri plans, hydration, light-exercise timing, no deficit prompts by default |
| `/family` | One menu with per-person portions (children, elders, a family member with a condition), doctor note slot |
| `/planner` | Taka-aware weekly planner with shopping list and cheap-protein finder |
| `/calendar` | Seasonal and festival calendar, respectful tone |
| `/conditions` | Condition-aware plates, always behind a safety gate and a visible doctor note |
| `/insights` | Weekly review without scolding, diversity score, sodium and oil awareness, sugar as spoons |
| `/admin` | Foods, recipes, prices editor, "report wrong calories" queue, anonymised analytics (role-gated, denser tables, same tokens) |
| `/privacy`, `/about`, `/sources` | Static pages |

---

## 6. Required states for every page

**Loading** (skeletons that match the final layout, not spinners), **empty** (explains the next step and offers the action), **error** (what happened, how to fix it, retry), **offline** (banner, cached data, queued-sync pill), **restricted** and **doctor-first** modes, **dark mode**, **Bangla and English**, **large-text** and **low-literacy** modes, **data-saver** (no images load until tapped).

**Safety-mode rules for the hero and charts:** in `restricted`, remove the Guide stat, the guide band and any deficit wording and use maintenance wording; in `doctor-first`, show eaten amounts and the plate balance only, no target of any kind, with the referral card pinned at the top of `/home`.

---

## 7. Copy guide

- Plain verbs, sentence case, active voice. Buttons say what happens ("Save to lunch", not "Submit"). One name per action through the flow ("Save" leads to a "Saved" toast).
- Name things the way users do: "rice plate", "shared pot", "spread it over the week".
- Errors do not apologise or blame; they say what to do.
- All strings live in `messages/bn.json` and `messages/en.json`; no hard-coded text in components.
- Over-day tone, EN: "Friday was a bigger day. Here is a gentle way to spread it over the next 4 days." BN: "শুক্রবার একটু বেশি খাওয়া হয়েছে। চলুন, পরের ৪ দিনে ধীরে ধীরে সামলে নিই।"

---

## 8. Technical requirements

- Next.js 16 App Router, server components by default, client components only for interaction. Tailwind 4 with all tokens in `@theme` and CSS variables for dark mode. Icons from `lucide-react`.
- Folders: `app/(auth)/{login,signup}`, `app/(app)/{home,log,plan,coach,activity,settings,onboarding}`, `components/{shell,data,forms,chat}`, `lib/{format.ts,nav.ts,mock/}`, `messages/`.
- Lazy-load the coach, photo capture and charts. Keep each page's JS small.
- PWA-ready: manifest, icons, `theme-color` for both modes, safe-area insets, no layout shift on font load.
- Accessibility: landmarks, labelled inputs, sensible focus order, `aria-live` for toasts and chat streaming.
- Performance on a mid-range Android over mobile data: first meaningful screen under 3 s, no image over 100 KB, fonts subset.
- Do not add a UI kit that fights the tokens. Headless primitives for dialogs, sheets and tabs are fine if fully styled with the tokens.

---

## 9. Order of work

**Deadline reality check.** The build plan's submission date is November 5, 2026, so ship in tiers and keep `main` demoable after each one.
- **Tier A (demo path, do first):** `AppFrame` with mobile bottom tabs and the desktop labelled sidebar only, `/login`, `/signup`, a short `/onboarding` (consent, profile, safety screen, summary), `/home`, `/log` with confirm and photo, `/plan`, `/coach`.
- **Tier B:** `/activity`, `/settings`, rice calibrator, recipe builder, `/log/street`, full onboarding.
- **Tier C:** the violet-rail tablet mode and Pattern 3 light rail, later-wave routes, admin, dark-mode polish, low-literacy mode.

0. Install and verify the two required skills (see Required skills) and start `docs/skills-log.md`.
1. Write `docs/ui-design-system.md` from sections 1 to 3 plus the ui-ux-pro-max design-system output, review it for anything that looks generic, then implement tokens, fonts, `AppFrame`, nav, theme and language switches, and `/_dev/components`.
2. `/login`, `/signup`, `/onboarding` (with safety outcomes).
3. `/home` (`HeroCard`, `CalorieRing`, `StatTile`, `PlateBalance`).
4. `/log` and sub-routes (demo-critical: search, parse sheet, confirm, rice calibrator, photo).
5. `/plan` (overshoot, 60/40 slider, gauge, feast mode).
6. `/coach` (citations, refusal cards, suggestion cards).
7. `/activity`, then `/settings`.
8. Later-wave stubs, offline and low-end polish, admin.

After each step, run the app, screenshot at 360, 768 and 1280 px in light and dark and in Bangla and English, compare against this spec, fix drift, then commit so `main` stays demoable.

---

## 10. Acceptance checklist

Tier A items must pass before submission; the rest as time allows.

- [ ] Every Tier A route renders with fixtures; Tier B and C routes exist at least as stubs
- [ ] Layout holds at 360, 768, 1280 px with no horizontal scroll, in Bangla and English
- [ ] Spacing is on the 8pt grid; radii, colours and shadows come from tokens only
- [ ] Signature looks are present (one gradient only, on the hero; thali-style plate balance): floating frame and violet rail, violet hero card with notched stat strip, coral accent card, goal cards with overlapping icon, inset stat wells, pastel tiles, semicircle gauge, segmented progress, split login card
- [ ] No weight-loss promise, medical reading, public leaderboard or map anywhere
- [ ] No component computes a health number; every estimate shows a range and a source tag
- [ ] `restricted` hides deficit controls; `doctor-first` shows no targets
- [ ] Light/dark, large-text, low-literacy and data-saver modes work on every page
- [ ] Loading, empty, error and offline states exist for every page
- [ ] Keyboard focus visible, touch targets at least 44px, text contrast AA (white text on violet, coral and action fills; `--ink` text on turmeric, leaf and mint tints)
- [ ] Reduced motion respected; only the home load sequence animates unprompted
- [ ] Demo path works with seeded data: onboarding, photo log, Banglish log, overshoot plan with live 60/40 toggle, coach citation, airplane-mode check
- [ ] ponytail and ui-ux-pro-max were installed and used: `docs/skills-log.md` lists each page's ui-ux-pro-max check and each tier's `/ponytail-review`, and every deliberate shortcut has a `ponytail:` comment