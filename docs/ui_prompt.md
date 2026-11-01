# UI Implementation Prompt: Deshi Health Companion

> Paste this whole file into Claude Code (or any coding agent) at the repo root.
> Before you start, copy the five reference images into `docs/ui-reference/` with these names:
> `ref-1-fitness-dashboard.png`, `ref-2-dokko-dashboard.png`, `ref-3-hierarchy-spacing.png`, `ref-4-himotou-exercise.png`, `ref-5-login.png`.

---

## 0. Your role and the job

You are the lead frontend engineer and designer for **Deshi Health Companion**, a Bangladesh-first calorie, diet and exercise-balancing web app (installable PWA) with a RAG-grounded AI coach. It is built for the Ostad YUNet AIgnite Buildathon 2026. Submission is **November 5, 2026**, so `main` must stay demoable at all times.

**Stack:** Next.js 16 (App Router), Tailwind 4, Convex, Groq, Vercel.

**Your task:** implement the complete UI for every page, shared shell and component listed below, matching the visual language of the five reference images. Backend wiring comes in parallel waves, so build every screen against typed fixtures first and swap in Convex queries later without changing the components.

Read these first, in order:
1. `docs/bangladeshi-calorie-companion-research.md` (source of truth)
2. The full-scope build plan v3 (waves 1 to 8)
3. The five images in `docs/ui-reference/`

### Hard rules that come from the product, not from taste

1. **The UI never invents numbers.** Calories, floors, caps, exercise minutes and grams come only from `lib/engine/` or a tool result. Components receive numbers as props and format them. They never calculate health values themselves.
2. **Every number that is an estimate shows its uncertainty.** Use `<Range>` ("620 to 780 kcal") or the "about" prefix, plus a `<SourceTag>` (FCTB, estimated-recipe, user-entered, AI-assisted).
3. **Shame-free copy.** Never write "you failed", "cheat day", "burn off your binge", "bad food", red alarm styling for an over-day. An over-day is a neutral amber note followed by a gentle plan.
4. **Safety modes change the UI.** `safetyMode()` returns `normal`, `restricted` or `doctor-first`. In `restricted` the deficit controls and rebalance planner are hidden. In `doctor-first` no calorie target, deficit or weight-loss pace is shown at all, only a calm referral card.
5. **Privacy.** Never put the user's name, age, weight or conditions into anything that is sent to the LLM. The UI may show them locally.
6. **Bangla is a first-class language, not a translation afterthought.** Every screen must work in Bangla, English and mixed use, with Bangla numerals when the language is Bangla.
7. **No remote images or hotlinks.** Use local assets, inline SVG and generated illustrations only (this also matters for offline and data-saver mode).

---

## 1. What to take from each reference image (and what to leave)

| Ref | Borrow | Do not copy |
|---|---|---|
| **1. Purple fitness dashboard** | Soft lavender canvas inside a rounded outer frame; a floating pill-shaped navigation rail; one hero "Overview" card with a smooth area chart, a highlighted data point with tooltip and a month/week selector; a notched stat strip under the chart; goal cards with a progress bar and a small "N days left" pill; a right column for secondary info | The "Friends" social list and the live map. This app has no public leaderboard. Replace the right column with today's meals and a coach nudge |
| **2. DoKKo health dashboard** | Labelled left sidebar with active item as a solid blue pill; greeting header ("Hello, name") with a subtle wave emoji; bar-range "Health Overview" chart; stacked panels (upcoming, recent, list) with a clear card hierarchy; chips with status labels such as "Scheduled / Completed"; neutral grey-white surface | The 3D muscle model, heart rate, blood pressure, ECG, appointments and "Upgrade now". We are not a medical app. Use the same layout slot for a **plate-balance visual** (see Home) |
| **3. Hierarchy and spacing board** | The **8pt grid** (every gap, padding and size is a multiple of 8, with 4 allowed for tight icon gaps); strict visual hierarchy (page title, section label with a dot, card title, value); small stat cards with a tiny chart inside; neumorphic-soft cards on a light grey base; icon-only rail with a light/dark toggle at the bottom; top bar with search, notification bell and avatar | The anatomy renders and clinical readings |
| **4. himotou exercise page** | Top tabs inside a page (Exercise, Food plan, Daily habits, Water intake); a large page title with a "Day N" subtitle; a hero exercise card with a circular timer chip and segmented progress bars; a "Next" row of three cards; pastel-tinted quick-tile grid (green, blue, lilac, peach) with icon + label; a semicircle gauge for the goal; a small success toast at the bottom | The "30 days to lose 30lb" headline and any weight-loss promise. The title becomes a neutral rhythm headline such as "Day 21 of your 28-day plan" or "Today's movement". The anatomy illustration is replaced by a clean line-icon or illustration of the activity |
| **5. Konekta login** | Split card on a warm grey page: rounded image panel on the left, form on the right; centered logo, bold title, grey subtitle; pill-shaped inputs with grey labels; "Remember login" and underlined "Forgot password"; full-width purple pill primary button; "Or continue with" divider; two grey pill social buttons; "New here? Create account" footer | The Apple sign-in button (not needed, skip it). The left image is a local botanical or food-ingredient collage of Bangladeshi produce (rice, lentils, hilsa, gourd, green chili) as an SVG or optimised WebP, not a stock photo |

**Shared visual DNA to carry across all pages:** very large corner radii (cards 24, inner tiles 16, buttons and inputs fully pill-shaped), generous whitespace, soft diffuse shadows, pastel tinted tiles, violet-and-blue accents with one warm accent, rounded sans type, subtle gradients only inside hero cards.

---

## 2. Design plan (produce this first, then build)

Before writing page code, create `docs/ui-design-system.md` with the tokens below, review it against the references and the product rules, adjust anything that feels generic, and note what you changed. Then implement the tokens in `app/globals.css` using Tailwind 4 `@theme`.

### 2.1 Color tokens (light and dark)

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ink` | `#1E1A2E` | `#F1EFF8` | Primary text |
| `--canvas` | `#EEEDF5` | `#14121F` | Page background (lavender-grey from refs 1 and 3) |
| `--surface` | `#FFFFFF` | `#1D1A2C` | Cards |
| `--surface-soft` | `#F6F5FA` | `#25223A` | Inner tiles, inputs |
| `--violet` | `#5B3E9E` | `#9B84E0` | Primary actions, rail, hero card |
| `--blue` | `#2F62F0` | `#6C93FF` | Active nav pill, links, charts secondary |
| `--coral` | `#F2678F` | `#FF86A7` | Hero accent card, highlight point |
| `--leaf` | `#2F8F67` | `#59C596` | "Balanced", success, plate balance good |
| `--turmeric` | `#E9A23B` | `#F5BC62` | Gentle caution, near the cap (never red) |

Pastel tiles (ref 4): `mint #E4F6EC`, `sky #E3F0FF`, `lilac #ECE6FA`, `peach #FDEBDD`, each with a darker same-hue icon colour. Define dark variants too.

Rules: contrast AA minimum for text. Never use pure red for calorie states; reserve a muted `--rose` only for form errors. Semantic colour must always be paired with an icon or text label, never colour alone.

### 2.2 Typography

- **Latin:** Manrope (matches refs 3 and 5). **Bangla:** Hind Siliguri, with Noto Sans Bengali as fallback. Load both with `next/font`, subset, `display: swap`.
- One family stack for the whole app, set as `font-family: var(--font-latin), var(--font-bangla), system-ui, sans-serif`.
- Scale (px): 12, 14, 16, 20, 24, 32, 40. Weights 400, 500, 700, 800 for big numbers.
- Bangla gets `line-height: 1.65` (Latin 1.4) and about 1px larger size at body level because Bangla glyphs read small. Test conjuncts (যুক্তাক্ষর) are not clipped in chips and buttons.
- Page title style like ref 3: 32/40 bold, followed by section labels with a small coloured dot (ref 3 "• Heart Conditions"). Use the dot only where it marks a real section, not as decoration.
- Numbers: tabular figures for all stats. Use `Intl.NumberFormat('bn-BD')` when language is Bangla. Build one `formatNumber`, `formatRange`, `formatKcal` helper in `lib/format.ts` and use it everywhere.

### 2.3 Spacing, radius, elevation

- 8pt grid: 8, 16, 24, 32, 40, 48, 56, 64. Card padding 24 (16 on mobile). Gap between cards 16 to 24.
- Radii: page frame 32, card 24, tile 16, chip and button and input 999px.
- Shadows: one soft ambient shadow for cards (`0 8px 24px rgb(60 40 120 / 0.08)`), one pressed/inset variant for the neumorphic stat tiles from ref 3. Dark mode uses border + subtle glow instead of shadow.
- Hero cards (ref 1 purple, ref 4 gauge card) may use a violet to indigo gradient. No other gradients.

### 2.4 Motion (restraint)

- One orchestrated moment: on first load of `/home`, the calorie ring fills and the 7-day area chart draws in. Nothing else animates on load.
- Interaction motion only: tab underline slide, sheet open, chip select, slider drag, toast in/out, the logged-meal "added" confirmation.
- Respect `prefers-reduced-motion` (replace with instant state changes).

### 2.5 Layout concept

```
Mobile (default, 360 to 430px)          Desktop (>=1024px)
+------------------------+              +----+---------------------------+----------+
| greeting + avatar  [bn]|              |rail| page title   search bell av|  right   |
| hero card              |              |    +---------------------------+  panel   |
| stat tiles (2 col)     |              |    | hero card   | goal tiles  |  meals   |
| sections ...           |              |    | stat strip               |  nudge   |
+------------------------+              |    | cards row                |          |
| Home Plan [+] Coach Act |              +----+---------------------------+----------+
+------------------------+
```

- **Mobile first.** Bangladesh usage is mostly phones. Bottom tab bar with 5 items: Home, Plan, **Log (centre, raised button)**, Coach, Activity. Settings lives in the avatar menu.
- **Tablet (768+):** icon-only floating rail on the left (ref 1 and 3), no bottom bar.
- **Desktop (1280+):** rail expands to a labelled sidebar (ref 2) with an active blue pill, plus the right-hand panel from ref 1. The whole app sits in a rounded frame on the lavender canvas like ref 1.
- Alignment: left aligned everywhere. Big numbers left aligned in cards. Centre alignment only on the login title block and empty states.

---

## 3. App shell and shared components

Build these first in `components/` (client components only where needed). Each gets a Storybook-style demo route at `/_dev/components` (hidden in production).

**Shell**
- `AppFrame`: outer rounded canvas, responsive rail/sidebar/bottom-bar switch.
- `NavRail`, `SideNav`, `BottomTabs`: same route list, one source in `lib/nav.ts`. Rail bottom holds the **light/dark toggle** and a logout icon (ref 1 and 3).
- `TopBar`: page title, search (opens food search sheet), language switch (বাংলা / EN), notification bell, avatar menu.
- `RightPanel` (desktop only): "Today" meals list, coach nudge, safety or offline notices.
- `OfflineBanner`, `SyncStatusPill`, `SafetyBanner` (calm, informational, with referral wording slot).

**Data display**
- `HeroCard` (violet gradient, ref 1): title, period selector, area chart with highlighted point and tooltip, notched stat strip below.
- `StatTile` (ref 3): icon, label, value, optional tiny sparkline or tick-bar inside, soft inset style.
- `PastelTile` (ref 4): tinted square with icon and two-line label. Used for quick actions.
- `GoalCard` (ref 1 bottom row): round icon button on top, title, subtitle, labelled progress bar, "N days left" pill.
- `CalorieRing`, `SemiGauge` (ref 4), `AreaChart`, `BarRangeChart` (ref 2 health overview), `SegmentedProgress` (ref 4), `Sparkline`. Build these as small hand-written SVG components, not a chart library, to keep the bundle light for low-end phones.
- `PlateBalance`: a simple top-down plate divided into vegetables, protein, grains, other with the share filled in. It takes the place of the anatomy figure in refs 2 and 3.
- `Range`, `SourceTag`, `MicronutrientRange`, `Num` (language-aware number).
- `Chip`, `TabBar` (underline style from ref 4), `SegmentedControl`, `Slider` (for the 60/40 split), `Toggle`, `StepperInput`, `Sheet` (bottom sheet on mobile, side drawer on desktop), `Toast`, `Skeleton`, `EmptyState`, `ConfirmDialog`.
- `Input`, `PillInput` (ref 5 style), `Select`, `Field` (label + hint + error), `Button` (primary violet, secondary grey, ghost, danger-soft).
- `CitationChip` (coach answers; shows section and page, opens a source drawer) and `ToolNumber` (visually tags a number that came from the engine or a tool).

All interactive elements: 44px minimum touch target, visible focus ring, accessible names in both languages.

---

## 4. Pages (build every one)

Routes: `/login /signup /onboarding /home /log /plan /coach /activity /settings`, plus sub-routes and later-wave pages in section 5. Use the fixtures in `lib/mock/` (typed to the engine's types, one seeded demo user with a week of data, clearly labelled as demo data).

### 4.1 `/login` and `/signup` (ref 5)

- Split card on warm grey (`#D6D5D0`) page, white card with radius 40, left image panel radius 24 (local botanical-ingredient collage, hidden below 768px so mobile shows the form only).
- Right: logo mark, title "Login to your account" (বাংলা: "আপনার অ্যাকাউন্টে লগইন করুন"), grey subtitle, Email and Password pill inputs, "Remember login" checkbox, "Forgot password?" underlined link, full-width violet pill **Login**, divider "Or continue with", **Google** button only, footer "New here? Create account".
- Signup uses the same layout with name, email, password, and a consent checkbox linking to the privacy page. No weight, age or condition collected here.
- States: field errors under inputs in plain language, loading spinner inside the button, disabled while submitting. Language switch top right of the card.

### 4.2 `/onboarding` (wizard)

One question group per step, large type, pill inputs, `SegmentedProgress` at the top (ref 4 style). Back and Next always visible. Progress is saved after each step so leaving does not lose answers.

Steps:
1. Language and text size
2. Consent, data use, "delete my data" explained in two lines, disclaimer
3. Profile: age, sex, height, weight, activity level
4. Body measures: **Asian BMI (23 / 27.5 cut-offs)**, waist, waist-to-height ratio, shown as a small result tile with a neutral wording
5. Goal and pace: maintain, gentle change, build strength. Pace options appear only if `safetyMode` is `normal`
6. Safety screening questions, one per screen, plain wording. Result may switch to `restricted` or `doctor-first`; show a calm explanation card and the referral copy slot
7. Eating style: rice-heavy, roti-heavy, vegetarian, no-beef, halal-only, fasting habits
8. Budget band in taka, household (who cooks, how many eat from the pot, meals out)
9. Daily routine: prayer times, commute
10. Summary: "Here is your starting point" with ranges and a "Looks right" primary button

Doctor-first outcome: replace steps 5 and the summary targets with a referral card, still allow food logging without targets.

### 4.3 `/home` (refs 1, 2, 3)

Greeting "Hello, {name} 👋" with today's date. Desktop: left sidebar, centre content, right panel.

- **Hero card (ref 1):** "Today" with the `CalorieRing` (eaten vs today's guide, shown as a range), and a 7-day `AreaChart` underneath with the current day highlighted and a tooltip. Period selector: Day / Week.
- **Stat strip inside the hero (ref 1 notch):** Protein, Carbs, Fat as three values with units.
- **Stat tiles row (ref 3):** Rice portion (e.g. "about 1.5 bati"), Water, Steps, Fibre, each with a tiny sparkline.
- **Plate balance (replaces ref 2 anatomy):** `PlateBalance` with a one-line "why" text and the micronutrient ranges as small chips (iron, vitamin A, calcium, zinc, D, B12).
- **One next action:** a single pastel tile or button, such as "Log lunch" or "Take a 15-minute walk after dinner". Only one at a time.
- **Right panel:** Today's meals with calories per meal and edit buttons, coach nudge card, offline/safety notices.
- Overshoot day: an amber `SafetyBanner`-style card "A bigger day than planned. Here is a gentle way to spread it" linking to `/plan`.

### 4.4 `/log`

- **Search-first screen:** large pill search input, placeholder "Type in Bangla, English or Banglish (e.g. bhat dal alu bhorta)". Mic button (Chrome `bn-BD` only, hidden if unsupported), camera button (photo logging), barcode button.
- Meal tabs under the search: Breakfast, Lunch, Snacks, Dinner (underline `TabBar`, ref 4).
- **Quick lists:** chips for Recents, Favourites, "Same as yesterday", "Copy a meal".
- **Parse result sheet:** top 5 candidates as selectable rows with name (Bangla + English), portion text, kcal range, `SourceTag`. If parsing fails, show the tap-to-pick list. Portion controls: household measures (bati S/M/L, spoon, glass, ladle) and plate fractions as chips.
- **Confirm screen:** items, grams, kcal as a range, edit portion, remove item, "Report wrong calories", big **Save to {meal}** button.
- **Shared-pot mode** toggle: fraction of the pot or spoons from the pot.
- **Photo flow:** `/log/photo` capture or upload up to 3 images, "Reading your plate..." skeleton, result list with relative portion chips, the plate preset used, kcal range, edit before save. Always label "AI-assisted estimate".
- Sub-routes: `/log/rice` (**rice calibrator**: choose plate and bowl, 100/150/200/300 g reference visuals, save "my usual rice", rice type hints), `/log/recipe` (home-cooked recipe builder: ingredients, oil, servings, method), `/log/street` (street-food and restaurant presets with ranges).

### 4.5 `/plan` (refs 2 and 4)

- **Header:** "This week" with a date-range switcher.
- **7-day budget** as a `BarRangeChart` (ref 2 style): one bar per day, the guide band behind it, today highlighted. Weekly used vs weekly budget in a `SemiGauge` (ref 4).
- **Spread plan card** (only when `safetyMode = normal`): plain-language summary of the overshoot and how it is spread across the next days; **60/40 split slider** that updates the preview live; controls for window length, preferred exercise, days off; floor and caps shown as read-only notes; the arithmetic with a ± range in Bangla and English.
- **Planned-feast mode** (Eid, weddings) toggle with a date picker.
- **What-if simulator** and **reverse mode** as two tabs inside one card: "If I eat this..." and "To eat that on Friday, I should..."
- **Adaptive TDEE** note with honest states: "Estimate improving (3 of 14 days)". Weight-trend chart with noise notes (Eid, illness, travel).
- In `restricted`: hide the spread plan and show maintenance guidance. In `doctor-first`: show only the referral card.

### 4.6 `/coach` (chat)

- Mobile: full-screen chat. Desktop: conversation on the left, source drawer on the right.
- Message bubbles with rounded 24 corners; user bubbles violet, coach bubbles `surface-soft`. Bangla/English/Banglish input, suggestion chips above the input ("What can I eat for iftar?", "Cheap protein under 100 taka").
- `CitationChip` after each grounded answer (shows guideline section and page, opens the source drawer). `ToolNumber` for numbers coming from the engine.
- Refusal rendering: a distinct soft card ("I can't help with that, but here is a safer idea") never styled as an error. Low-retrieval-confidence rendering: "I could not find this in the guidelines" with a suggestion to ask a dietitian.
- Streaming text with a typing indicator, a stop button, a retry on failure, and a "why this suggestion" expandable line on every recommendation.
- Meal-suggestion cards inside chat (fit the remaining budget, cost band, season), smart-swap cards with local alternatives, cheap-protein finder table.
- Input bar: text, mic, send. Sticky above the bottom tabs.

### 4.7 `/activity` (ref 4)

- Top `TabBar` like ref 4: **Exercise, Food plan, Daily habits, Water intake**. Food plan links to `/plan` content summary, Daily habits and Water are simple trackers.
- Large title "Today's movement" with subtitle "Day N" when a plan is active.
- **Hero exercise card:** circular timer chip (e.g. `4:35`), activity name, sets or minutes, a clean illustration, and `SegmentedProgress` below.
- **"Next" row:** three cards with a small illustration, name and duration (ref 4 bottom).
- **Pastel quick tiles (2 x 3):** Walk, Cycle, Home workout, Cricket or football, Yoga, Chores. Each opens a MET-based logging sheet showing net calories as a range.
- **Right column:** `SemiGauge` for this week's active minutes, and a success toast style note "Good work, you are on track this week".
- **Manual steps entry** (web substitute for step import), **context-aware banner** (heat, rain, air quality, load-shedding, daylight) that switches suggestions to indoor options, **prayer-time and Ramadan slots**, **women-friendly privacy mode** badge (home-only plans, no leaderboard).
- No-equipment plans (rooftop, balcony, room, low-noise) as a filter chip row.

### 4.8 `/settings`

Grouped cards: Profile, Eating style and budget, Household, Daily routine, Language and text size, Appearance (light, dark, large text, low-literacy mode with icons), Data saver, Notifications, **Privacy and data** (consent, export, **Delete my data** with a typed confirmation and a clear result message), Offline and sync status, About, sources and dataset licences, Report a problem.

---

## 5. Later-wave pages (stub the route and layout now, fill in as waves land)

| Route | Content | Wave |
|---|---|---|
| `/ramadan` | Iftar and sehri plans, hydration, light-exercise timing, no deficit prompts by default | 6 |
| `/family` | One menu with per-person portions (children, elders, a family member with a condition), doctor note slot | 6 |
| `/planner` | Taka-aware weekly planner with shopping list and cheap-protein finder | 6 |
| `/calendar` | Seasonal and festival calendar, respectful tone | 6 |
| `/conditions` | Condition-aware plates, always behind a safety gate and a visible doctor note | 6 |
| `/insights` | Weekly review without scolding, diversity score, sodium and oil awareness, sugar as spoons | 3 and 5 |
| `/admin` | Foods, recipes, prices editor, "report wrong calories" review queue, analytics (role-gated) | 7 |
| `/privacy`, `/about`, `/sources` | Static pages: privacy, disclaimer, data sources and licences | 1 |

Admin uses the same components with denser tables, but the same tokens.

---

## 6. Required states for every page

Every page and every data component must handle: **loading** (skeletons, not spinners), **empty** (explains what to do next and offers the action), **error** (what happened, how to fix it, retry), **offline** (banner plus cached data, queued sync indicator), **restricted** and **doctor-first** safety modes, **dark mode**, **Bangla and English**, **large-text and low-literacy modes**, **data-saver** (no images loaded unless tapped).

---

## 7. Copy guide

- Plain verbs, sentence case, active voice. Buttons say what happens: "Save to lunch", not "Submit".
- Name things as users do: "rice plate", "shared pot", "rebalance", not "caloric deficit distribution".
- Keep one name for each action across the flow ("Save" produces a "Saved" toast).
- Errors do not apologise or blame, they say what to do.
- Provide every string in `messages/bn.json` and `messages/en.json`. No hard-coded text in components.
- Example tone for an over-day: EN "Friday was a bigger day. Here is a gentle way to spread it over the next 4 days." BN "শুক্রবার একটু বেশি খাওয়া হয়েছে। চলুন, পরের ৪ দিনে ধীরে ধীরে সামলে নিই।"
- Never promise weight outcomes. Replace any "lose X in Y days" pattern with neutral rhythm language.

---

## 8. Technical requirements

- Next.js 16 App Router, server components by default, client components only for interaction. Tailwind 4 with tokens in `@theme`. Icons from `lucide-react`.
- Folder layout: `app/(auth)/login`, `app/(auth)/signup`, `app/(app)/{home,log,plan,coach,activity,settings,onboarding}`, `components/{shell,data,forms,chat}`, `lib/{format.ts,nav.ts,mock/}`, `messages/`.
- Charts and gauges are hand-written SVG. Keep each page's JS small; lazy-load the coach, photo capture and charts.
- PWA-ready: manifest, icons, `theme-color` for light and dark, safe-area insets, no layout shift on font load.
- Accessibility: semantic landmarks, labelled inputs, focus order, `aria-live` for toasts and chat streaming, charts with text alternatives (a visually hidden table).
- Performance budget on a mid-range Android over 3G-class mobile data: first meaningful screen under 3 s, no images above 100 KB, fonts subset.
- Do not add a UI kit that fights the tokens. If you use headless primitives for dialogs, sheets and tabs, style them fully with the tokens.

---

## 9. Order of work

1. `docs/ui-design-system.md`, tokens, fonts, `AppFrame`, nav, theme and language switches, `/_dev/components`.
2. `/login`, `/signup`, `/onboarding` (with safety outcomes).
3. `/home` with `HeroCard`, `CalorieRing`, `StatTile`, `PlateBalance`.
4. `/log` and sub-routes (the demo-critical path: search, parse sheet, confirm, rice calibrator, photo).
5. `/plan` (overshoot, 60/40 slider, gauge, feast mode).
6. `/coach` (citations, refusal cards, suggestion cards).
7. `/activity`, then `/settings`.
8. Later-wave stubs, offline and low-end polish, admin.

After each step, run the app, screenshot at 360, 768 and 1280 px in light and dark and in Bangla and English, compare with the references, and fix drift before moving on. Commit after each step so `main` stays demoable.

---

## 10. Acceptance checklist

- [ ] Every route in sections 4 and 5 exists and renders with fixtures
- [ ] Layout holds at 360, 768, 1280 px with no horizontal scroll, in Bangla (longer strings) as well as English
- [ ] Spacing is on the 8pt grid; radii and shadows come from tokens only
- [ ] Visual match to refs: floating rail, violet hero card with area chart, pastel quick tiles, semicircle gauge, split login card
- [ ] No weight-loss promise, anatomy graphic, medical reading, friends list or map anywhere
- [ ] No component computes a health number; every estimate shows a range and a source tag
- [ ] `restricted` hides deficit controls; `doctor-first` shows no targets
- [ ] Light/dark, large-text, low-literacy and data-saver modes work on every page
- [ ] Loading, empty, error and offline states exist for every page
- [ ] Keyboard focus visible, touch targets 44px or more, text contrast AA
- [ ] Reduced motion respected; only the home load sequence animates unprompted
- [ ] Demo path works with seeded data: onboarding, photo log, Banglish log, overshoot plan with live 60/40 toggle, coach citation, airplane-mode check
