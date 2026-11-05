# Deshi Health Companion — Project Context & Improvement Tracker

**Project:** Deshi Health Companion (working title) — Bangladesh-first calorie, diet & exercise-balancing app with RAG-grounded AI coach
**Pivot:** Formerly HabitForge (AI Habit Tracker). Platform carries over; product scope now follows `docs/bangladeshi-calorie-companion-research.md` (sole source of truth — no invented features)
**Buildathon:** Ostad Presents YUNet AIgnite Buildathon 2026
**Timeline:** November 1–5, 2026

> [!IMPORTANT]
> This document is the **living tracker** for the project. Update it as decisions are made, bugs are found, features are completed, and improvements are identified. Session history below is preserved as-is.

---

## 📋 Quick Status

| Item | Status |
|------|--------|
| **Product** | 🔄 Pivot to Deshi Health Companion — docs suite rewritten (SRS/Arch/Endpoints/Plan v3) |
| **Current Phase** | **Waves 1–6 complete (all gates met); Deferred features in progress** — W6 gate: Ramadan zero-deficit guardrail, family mode `/family` (one menu, per-person portions), condition plates with doctor note; water tracking & BD division weather/AQI localization shipped |
| **Day** | Day 5 (Nov 5, 2026) |
| **Build Status** | ✅ `bun run build` passes 100% (21/21 static/dynamic routes), TypeScript check 0 errors, `bun test src/` 120/120 green |
| **UI** | ✅ Full route set on Deshi design system; official "Built For Ostad Presents YUNet AIgnite Buildathon 2026" sticker on navbar & sidebar; condition plate presets + calorie-driven `nextMove` & `exerciseRec`; live hydration tile (+250ml/undo); live settings & right-panel |
| **Convex Deployment** | ✅ `dev:disciplined-zebra-716` (project `habitforge`); schema live incl. `ragChunks`, `foodFacts`, `recipes`, `priceObservations`, `markets`, `nutritionIndicators`, `datasetSources`, `mealLogs`, `weighIns`, `profiles`, `waterLogs`, `weatherState` |
| **AI (Groq)** | ✅ `GROQ_API_KEY` on Convex; chat `openai/gpt-oss-120b`; vision `qwen/qwen3.8-27b`; **embeddings local** `Xenova/multilingual-e5-small` (384d) via `/api/embed` |
| **P0 product surface** | ✅ Onboarding (with division selector), `/log`, `/plan`, `/home`, `/insights`, `/activity`, `/coach`, `/settings` all connected to live Convex backend with zero mock fixtures |
| **PWA & Offline** | ✅ Service worker `public/sw.js` registered, offline food search across 318 Deshi staples, standalone manifest |
| **Last Updated** | 2026-11-05 (Water tracking + BD 8-division coordinates & weather localization shipped; 120 tests green) |

### Wave 1 gate (Nov 2, 2026) — MET

- **Engine:** `src/lib/engine/{types,energy,safety,rebalance,adaptive,index}.ts` — pure TS shared client+Convex
- **Tests:** `bun test src/lib/engine/engine.test.ts` → **27 pass / 0 fail** (~150k assertions, 5000-case property test)
- **Hand-check:** 70 kg, 40 min @ 4.3 MET → **154 kcal net** ✓
- **Six safety profiles (unit + Convex `profile:save` smoke):** normal / under-18→doctor-first / low BMI→restricted / insulin→doctor-first / ED history→doctor-first / pregnancy→doctor-first
- **Schema v2 live:** profiles (engine-derived `safetyMode`, Asian BMI), foods, mealLogs, activityLogs, budgetState (reserved), weighIns, auditLogs, weatherState, ragChunks + corpus tables; habit tables dropped
- **Foods:** Wave 1 gate originally used 171 rows; Wave 2 now has **318** reconciled rows — FCTB 111, estimated-recipe 162, estimated 23, borrowed 21, measured 1
- **Onboarding:** final step → `api.profile.save` (deterministic safetyMode server-side); energy query returns BMR/TDEE/floor
- **Privacy:** `privacy:deleteMyData` + audit trail live
- **LLM scaffold:** `ai:chat` (privacy-safe context only), `ai:parseMeal` (top-5 candidate pick — W2)

### Wave 2 progress (Nov 2–3, 2026)

- `convex/mealLogs.ts`: live `listByDate`, `listRecent`, `create`, `update`, `remove`, `copyMeal`, `daySummary`; bounded indexed reads, return validators, profile-key checks
- `/log`: bundled offline Bangla/English/Banglish alias search; code-only gram/kcal ranges; Convex create/list/delete; Groq parser with offline fallback
- Food seed: **318 unique rows**, stale seeded names reconciled safely, indexed Bangla/English server search; 3 regression tests prevent duplicate/invalid rows
- Parser: **20 deterministic lines pass**; live Groq smoke selected bhat/dal/alu bhorta/dim exactly from 14 candidates
- Shared pot: 1000 g dal × 1/5 = 200 g; deterministic range test + UI pass
- Smoke: create → list → copy → summary → wrong-key rejection → cleanup passed on `dev:disciplined-zebra-716`
- Verification: **53 tests**, lint 0 errors (4 generated warnings), root + Convex TypeScript pass, production build passes
- Remaining W2 gate: five assisted-photo tests; spoon-based shared-pot entry and other W2 enhancements remain
- Photo gate (Nov 3): `ai.analyzePhoto` live (qwen3.8-27b, ITPM-safe compact prompt + 429 retry) + `/log/photo` wired; FoodBD 10-image gate → 49% recall / 55% precision / 123 kcal mean error; **Wave 2 marked complete**

### RAG data foundation (Nov 3, 2026)

- **Corpus:** **9,447 chunks** in `ragChunks` — guidelines 259, FCTB/IFCT books + food facts + aliases 2,712, indigenous 232, research 76, recipes 5,938, prices 73, FAOSTAT 157
- **Structured mirrors:** `foodFacts` 913 · `recipes` 5,938 · `priceObservations` 34,491 · `markets` 171 · `nutritionIndicators` 23,746 · inventory in `datasetSources` (16)
- **Embeddings:** local `Xenova/multilingual-e5-small`, quantized, 384 dims, cached in `.cache/transformers`; no second API key. `POST /api/embed` verified (384 dims, Bangla input)
- **Retrieval:** `rag.search` (vector + keyword merge) and `rag.keywordSearch`; alias doc fixes Bangla/Banglish lookups (`alu bhorta` → 0.982; `ভর্তা` → 0.977)
- **Pipeline:** `scripts/prepare_rag_data.py` (pdftotext + CSV/JSON → JSONL) → `scripts/ingest_rag.mjs` (embed + token-guarded upsert) → `scripts/test_rag.mjs`
- **Data quality fixes:** FCTB categories recovered from code prefixes; 318-row alias index added; 34,491 WFP price rows and 23,746 FAOSTAT rows deduplicated
- **Known gaps:** `rice-glycaemic-index-bau.pdf` has no text layer (needs OCR); cross-lingual Bangla medical queries retrieve food aliases ahead of guideline sections — add Groq query rewrite before embedding
- **Verification:** 53 tests, lint 0 errors, both TypeScript checks, production build (20 routes incl. `/api/embed`) pass

### Wave 5 gate (Nov 3, 2026) — MET

- `scripts/eval_wave5.mjs`: **20/20** questions returned the expected source in top-5 (hybrid threshold 0.8); explicit indigenous/healthy-plate intents route to the matching corpus source.
- Unsafe red-team subset: **10/10** calmly refused with a safer alternative; includes crash diet, insulin + fasting, meal compensation, purging, chest pain/fainting, pills and diagnosis.
- Numeric traceability: every reply digit must occur in retrieved excerpts or the user's message; one corrective retry → language-matched fallback. Live-proven on unsourced step counts.
- `/coach` now reads live `profile.safetyMode`/goal and fails closed to `doctor-first` while loading; no-hit retrieval returns localized refusal without calling Groq.

### Wave 6 gate (Nov 4, 2026) — MET

- **Ramadan zero-deficit:** `src/lib/engine/ramadan.ts` + `wave6.test.ts` ("ramadan mode strictly blocks calorie deficit by default"; opt-in path tested); `/insights` fasting mode shows "Zero Deficit Guardrail" badge and never prompts a deficit by default.
- **Family mode (FR-G-06):** `src/lib/engine/family.ts` — one shared `FAMILY_MENU`, per-person portions by relation factor (child 0.5 / teen 0.75 / adult 1.0 / elder 0.8), rice bati + protein servings math; condition members get the `conditionPlates` clinical disclaimer. `/family` page (add/remove members → `profile.saveFamilyMembers`, max 8) + `/plan` CTA + sidebar entry. **6 gate tests** in `family.test.ts`.
- **Condition modes (FR-G-08):** `/home` condition plate presets render `clinicalDisclaimer` (doctor note) — verified at `home/page.tsx:363`.
- FR-G-04 marked **partial** (sehri/iftar + hydration live; light-exercise timing still pending). Taka planner, festival calendar, region/plate wiring carried → `docs/deferred.md`.
- Gates: tsc ✓ · lint 0 errors · **115/115 tests** · build ✓ (21 routes incl. `/family`).

### Docs re-audit (Nov 2, 2026)

| Doc | Action | Notes |
|-----|--------|-------|
| `ENDPOINTS.md` | ✅ Updated to v3.3 | Live Wave 1–2 functions, exact signatures, indexed searches, 318-row seed reconciliation |
| `ARCHITECTURE.md` | ✅ Updated to v3.2 | Layer status, live/planned data model, current directory tree, Manrope + Hind Siliguri |
| `SRS.md` | ✅ Updated to v2.2 | Convex table mapping + **§9 SRS Traceability Table** (140 IDs with status/priority/wave/implementation) |
| `IMPLEMENTATION_PLAN.md` | ✅ Updated | Wave status markers (W1 ✅ Done, W2 🔄 In progress); **added §2a Wave status summary table** |
| **`DIAGRAMS.md`** | ✅ **New** | **DFD Level 0 (context), Level 1 (7 processes), Level 2 (P2 logging, P4 engine, P6 RAG, P1 onboarding); 8 sequence diagrams** |
| `ui_prompt.md` | ✅ Clean | No changes needed |
| `ui-design-system.md` | ✅ Clean | Matches implemented tokens |
| `bangladeshi-calorie-companion-research.md` | ✅ Clean | Source of truth — untouched |

### UI build note (Nov 2, 2026)

- Design tokens in `src/app/globals.css` (violet/lavender, pastels, radii, Manrope + Hind Siliguri)
- Shell: `AppFrame`, `NavRail`/`SideNav`/`BottomTabs`, `TopBar`, right panel, offline/safety banners
- Routes: `/login /signup /onboarding /home /log(+photo|rice|recipe|street) /plan /coach /activity /settings /insights /dev/components`
- Most pages still use `src/lib/mock`; onboarding and `/log` are Convex-backed; messages come from `messages/{en,bn}.json`
- Deleted: `analytics`, old `coach`, habit components, `useHabits`
- Note: gallery lives at `/dev/components` (App Router treats `_dev` as a private folder)

### Pivot banner (Nov 2, 2026)

- **New spec:** `docs/bangladeshi-calorie-companion-research.md` — market/gaps (§1–2), health context (§3), data sources (§4), rebalance engine (§5), P0/P1/P2 checklist (§6), RAG architecture (§7), evaluation (§8), demo (§9), build order (§10)
- **Build plan:** `docs/IMPLEMENTATION_PLAN.md` **v3** — full scope (all P0/P1 + most P2) in **8 waves with exit gates**; v2 quality decisions kept (deterministic `lib/engine/`, LLM never numbers, safety gates, citations, assisted photo, Bangla plan templates); Convex vector search + Qwen vision + PWA substitutions verified
- **Docs rewritten:** SRS v2.2, ARCHITECTURE v3.2, ENDPOINTS v3.3, IMPLEMENTATION_PLAN v3, CONTEXT, **DIAGRAMS** (DFD L0–L2 + 8 sequence diagrams)
- **Platform kept:** Convex, Groq AI, Claymorphism design system, build/lint green
- **Never cut:** safety gates · citations · rebalancing engine (wave gates enforce this)

---

## 🏗️ What's Been Built

### Day 1 — November 1, 2026

**Session 1 (19:46–20:05)** — Foundation

| Time | Action | Result |
|------|--------|--------|
| 19:46 | Project ideation & planning | Selected HabitForge — AI Habit Tracker |
| 19:52 | Scaffolded Next.js 16 with Bun | ✅ Project initialized |
| 19:53 | Installed `@google/generative-ai`, `lucide-react` | ✅ Dependencies ready |
| 19:54 | Built core library layer | ✅ `types.ts`, `storage.ts`, `analytics.ts`, `gemini.ts` |
| 19:55 | Built React hook | ✅ `useHabits.ts` |
| 19:56 | Built UI components | ✅ Navbar, HabitCard, HabitGrid, StatsCards, AddHabitModal |
| 19:57 | Built API routes | ✅ `/api/coach`, `/api/analyze`, `/api/suggest` (later replaced by Convex) |
| 19:57 | Built pages | ✅ Dashboard (`page.tsx`), AI Coach (`coach/page.tsx`) |
| 19:58 | Updated layout & styles | ✅ `layout.tsx`, `globals.css` |
| 20:03 | Created documentation | ✅ SRS, Architecture, Endpoints, Implementation Plan |

**Session 2 (20:15–21:00)** — Convex migration verified & Phase 1 closed

| Time | Action | Result |
|------|--------|--------|
| 20:19 | Migrated backend to Convex (commit `bc65df3`) | ✅ Schema, queries/mutations/actions |
| 20:35 | Reviewed all code vs Phase 1 plan | ❌ Build was broken (`convex/_generated` missing) |
| 20:45 | Convex login + project setup + `env set GEMINI_API_KEY` | ✅ `disciplined-zebra-716` |
| 20:47 | Fixed wrong import path in `HabitCard.tsx` | ✅ TypeScript passes |
| 20:49 | Fixed Next 16 prerender crash (`new Date()` in hook) | ✅ Build passes — gate stats on `isLoaded` |
| 20:50 | Removed dead code: `src/app/api/*`, `lib/gemini.ts`, `lib/analytics.ts`, `lib/storage.ts` | ✅ localStorage era fully retired |
| 20:52 | Updated Gemini model `gemini-2.0-flash` → `gemini-3.8-flash` (old one 404s) | ✅ Model configurable via `GEMINI_MODEL` env |
| 20:54 | End-to-end AI test via `convex run ai:suggest` | 🟡 Auth OK, but **403 free-tier/billing blocked** (user action needed) |
| 20:56 | Lint: 0 errors (only warnings in `_generated/*`) | ✅ |
| 21:00 | Updated all 5 docs to Convex architecture | ✅ SRS, Architecture, Endpoints, Plan, Context |
| 21:05 | **Phase 2:** built `WeeklyChart`, `CategoryChart`, `HabitAnalyticsCard`, `AIReport`, `analytics/page.tsx` | ✅ CSS-only charts, no chart library |
| 21:12 | Build + lint + Convex push + HTTP smoke test (`/`, `/analytics`, `/coach` → 200) | ✅ Phase 2 closed |
| 21:15 | **Phase 3:** dark mode toggle (class-based Tailwind v4 + no-FOUC script) | ✅ `ThemeToggle.tsx` |
| 21:20 | Habit editing modal wired to `habits.update` | ✅ `EditHabitModal.tsx` + card menu |
| 21:25 | Toast notifications (context provider, aria-live) | ✅ wired to add/delete/edit/suggest |
| 21:28 | Confetti on all-daily-habits complete (seeded RNG, no deps) | ✅ `Confetti.tsx` |
| 21:30 | Dashboard loading skeleton + a11y pass (focus-visible, dialog roles, Escape, aria-labels) | ✅ |
| 21:35 | Fixed new React Compiler lint errors (purity/set-state-in-effect); build + lint green | ✅ Phase 3 closed |
| 21:45 | Fixed hydration mismatch on `<html>` (theme script added `dark` pre-hydration) | ✅ `suppressHydrationWarning` + `useLayoutEffect` re-apply per Next 16 "Preventing Flash" guide |
| 23:30 | **Full frontend redesign — Claymorphism** via ui-ux-pro-max skill (`design-system/habitforge/MASTER.md`) | ✅ Tokens + clay utilities in globals.css; Varela Round/Nunito Sans fonts; all 16 visual files restyled; old gray/indigo/purple palette fully removed; lint 0 errors, build ✅, all routes 200 |
| 23:55 | Monotone pass: removed all gradients/glows/pulse sticker, single amber hue + warm neutrals everywhere (heatmap, stats, confetti, report, chat) | ✅ lint 0 errors, build ✅, routes 200 |
| 00:10 | **Migrated AI from Gemini (403 billing block) → Groq** via raw REST in `convex/ai.ts`; model `openai/gpt-oss-120b` (override: `GROQ_MODEL`); removed `@google/generative-ai` + GEMINI env vars | ✅ chat/suggest/analyze all live-tested OK; lint 0 errors, build ✅ |

**Historical files at that time (superseded by the Nov 2 product pivot):**
- `convex/schema.ts` — Habits + habitLogs tables (indexed)
- `convex/habits.ts` — list/get/create/update/remove/archive functions
- `convex/habitLogs.ts` — list/toggle/addNote functions
- `convex/ai.ts` — `chat`, `suggest`, `analyze` actions (Gemini, server-side)
- `src/lib/types.ts` — HabitCategory, HabitLog, AIMessage, CATEGORY_CONFIG
- `src/hooks/useHabits.ts` — Convex-backed state + all streak/stats calculations
- `src/components/` — Navbar, HabitCard, HabitGrid, StatsCards, AddHabitModal, ConvexClientProvider
- `src/components/WeeklyChart.tsx` — 7-day completion bar chart (CSS-only)
- `src/components/CategoryChart.tsx` — habit distribution by category
- `src/components/HabitAnalyticsCard.tsx` — per-habit stats + 7-day strip
- `src/components/AIReport.tsx` — AI weekly report via `api.ai.analyze`
- `src/components/ThemeToggle.tsx` — dark/light switch (CSS-swap icons, no hydration mismatch)
- `src/components/EditHabitModal.tsx` — edit name/description/category/frequency
- `src/components/Toast.tsx` — toast context provider (success/error/info)
- `src/components/Confetti.tsx` — celebration overlay (deterministic seeded particles)
- `src/app/` — Dashboard, AI Coach, **Analytics**, layout, globals.css
- `docs/*` — Project documentation (5 files)

**Removed (superseded by Convex):**
- `src/app/api/{coach,analyze,suggest}/route.ts` — replaced by `convex/ai.ts` actions
- `src/lib/storage.ts`, `src/lib/analytics.ts`, `src/lib/gemini.ts` — logic moved into `useHabits.ts` / `convex/ai.ts`

---

## 🔮 What's Next

### Pivot plan — Deshi Health Companion (Plan v3 waves — see IMPLEMENTATION_PLAN.md)

**Probes (done):** Qwen vision ✓ (10 FoodBD plates, assisted gate) · local multilingual embeddings ✓ (384d Bangla) · Chrome `bn-BD` speech ⬜ not probed.

**Wave 1 (foundation):** ✅ Complete. Engine, safety modes, onboarding/profile, consent/delete-data, schema and tagged food seed passed their gate.

**Wave 2 now:** ✅ complete — manual logging + 318-food search + meal CRUD + parser/shared-pot + assisted photo flow (FoodBD-gated) all live; P1 extras (rice calibration, recipes, voice, barcode) carried beyond the gate. **Wave 5 data foundation is already live** (9,447 chunks + hybrid search); coach wiring live (client embed → `rag.search` → `ai.rewriteQuery` → `ai.chat` with excerpts → citation chips).

**Waves 3 + 4 + 5 + 6 complete (gates met).** Remaining in order: W7 offline/PWA/admin → W8 proof/deploy/deck.

**Never cut:** safety gates · citations · rebalancing engine. **Gate rule:** never start a wave with a failing gate behind it. Main branch stays demoable.

### Platform carry-over (from old Phase 4 — still needed)
1. [ ] Push code to GitHub
2. [ ] Connect to Vercel, set `NEXT_PUBLIC_CONVEX_URL` env var
3. [ ] Deploy + verify production
4. [ ] Real-device mobile testing (320px–768px) — **pending human**
5. [ ] Browser click-through (`bun dev`) — **pending human**
6. [ ] Lighthouse audit
7. [ ] README.md with setup instructions

### Day 5 Priorities
1. [ ] Presentation deck (5 slides, §9.2 judging map)
2. [ ] Demo video backup (optional)
3. [ ] Final submission

---

## 🐛 Known Issues & Bugs

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | App not yet tested in browser (`bun dev` manual click-through) | 🔴 Critical | ⬜ Open | Build/lint/smoke tests pass; needs human click-through with Convex |
| 2 | Real-device mobile testing not done | 🟡 Medium | ⬜ Open | Code reviewed for responsive, needs human devices |
| 3 | Chat history not persisted (session only) | 🟢 Low | ⬜ Open | Could save to localStorage or Convex |

*Pre-pivot issues such as Gemini billing and the old HabitForge UI are retained in session history only; they do not describe the current product.*

---

## 💡 Improvement Ideas

### High Priority
- [x] Wire `ai.parseMeal` into `/log` and evaluate 20 Banglish lines — live (20/20 + Groq smoke)
- [x] Implement shared-pot fraction-to-grams calculation and test dal example — live + tested
- [x] Wire assisted photo confirmation flow and test five plates — live (FoodBD gate, assisted mode)
- [ ] Complete rice calibration (`/log/rice` page exists but does not persist `ricePortionLabel` yet) and user recipe persistence

### Medium Priority
- [ ] Wire recents/copy-meal UI to the live backend (`mealLogs.listRecent`/`copyMeal` ready; `/log` chips are still decorative)
- [ ] Add favourites and report-wrong review queue
- [ ] Probe Chrome `bn-BD` voice input
- [x] Begin W3 budget-state UI integration — done: `/plan` reads `budget.get` live (plan computed on read)

### Low Priority (Post-Buildathon)
- [ ] User authentication (Convex Auth)
- [ ] Production-grade FCTB source-row verification
- [ ] Full PWA queue and local-first storage
- [ ] Barcode database expansion
- [ ] Dietitian-reviewed recipe contributions

---

## 🎨 Design Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Nov 1 | localStorage over database | Simplicity for MVP *(superseded — see Convex row)* |
| Nov 1 | Gemini 2.0 Flash over Pro | Faster responses; lower latency *(retired by Google — now `gemini-3.8-flash`)* |
| Nov 1 | No auth/accounts for MVP | Time constraint; focus on core value prop |
| Nov 1 | CSS-based Tailwind v4 config | Next.js 16 default; no `tailwind.config.ts` needed |
| Nov 1 | Hook-based state over Redux/Zustand | App is simple enough; no global state library needed |
| Nov 1 | AI on server-side only | Keep API key secure; never expose to client |
| Nov 1 | **Convex replaces localStorage + API routes** | Real persistence, realtime updates, no separate server; cross-device sync for free; API keys in Convex env |
| Nov 2* | **CSS-only charts** (no chart.js/recharts) | Zero extra deps, matches Tailwind styling, fast to build; revisit if charts feel limiting |
| Nov 1 | Gemini model via `GEMINI_MODEL` env var | Swap models without code changes when Google retires one |

---

## 📊 Tech Debt

| Item | Impact | Effort to Fix |
|------|--------|---------------|
| No Convex function test suite | Medium | Medium — add `convex-test` auth/data-scope coverage |
| No error boundary component | Medium | Low — add React error boundary |
| FCTB-tagged demo values not source-row verified | High | High — complete D1 import/review before production claims |
| Shared-pot, photo and parser gates incomplete | High | Closed — all Wave 2 gates met (Nov 3) |
| No authentication; profile key is demo-only | High | Medium — add Convex Auth before multi-user launch |
| AI responses not cached | Low | Low — add Convex caching if rate-limited |
| Bangla medical queries retrieve food aliases before guideline sections | Medium | Closed (Nov 3) — `ai.rewriteQuery` runs on Bangla/weak-score queries before the second search |
| `rice-glycaemic-index-bau.pdf` unparsed (scanned) | Low | Low — OCR (tesseract) or manual table entry |

---

## 🔑 Key Decisions Pending

| # | Decision | Options | Deadline |
|---|----------|---------|----------|
| 1 | Deploy URL / custom domain | Default Vercel URL vs. custom domain | Day 4 |
| 2 | Demo video recording tool | OBS vs. Loom vs. screen recording | Day 5 |

---

## 📝 Buildathon Submission Checklist

- [ ] **Live Web App URL** — Deployed on Vercel
- [ ] **Buildathon Sticker** — Visible in navbar ✅ (already implemented)
- [ ] **Presentation Deck** (max 5 slides)
  - [ ] Slide 1: Problem Statement
  - [ ] Slide 2: Proposed Solution
  - [ ] Slide 3: How It Works
  - [ ] Slide 4: Your Introduction
  - [ ] Slide 5: Key Info / Tech Stack
- [ ] **Demo Video** (YouTube, English, optional)
- [ ] **All code pushed to GitHub**

---

## 📈 Wave Progress

```
Wave 1 ████████████████████████  100% — Foundation gate met
Wave 2 ████████████████████████ 100% — Gate met: parser + shared-pot + FoodBD photo
Wave 3 ████████████████████████ 100% — Gate met; budget/what-if/reverse on /plan; home live; weigh-ins + adaptive TDEE on /insights; micros/sodium/sugar carried (docs/deferred.md)
Wave 4 ████████████████████████ 100% — Gate met: indoor switch on AQI/heat (Open-Meteo, no key) + MET minute tests; P1s carried (docs/deferred.md)
Wave 5 ████████████████████████ 100% — Gate met: 20/20 source retrieval + 10/10 unsafe refusal + numeric trace validator; live profile safety mode
Wave 6 ████████████████████████ 100% — Gate met: Ramadan zero-deficit · family menu (/family) · condition doctor note
Wave 7–8 ░░░░░░░░░░░░░░░░░░░░░░   0% — offline/admin, proof
```

---

*Last updated: November 4, 2026 — Waves 1–6 gates met; Wave 7 next; build plan v3 across all docs*
