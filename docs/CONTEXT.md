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
| **Current Phase** | **Wave 2 in progress** — manual logging, parser and shared-pot sub-gates pass; assisted-photo gate next |
| **Day** | Day 2 (Nov 2, 2026) |
| **Build Status** | ✅ `bun run build` passes, lint 0 errors, both TypeScript checks pass, `bun test` 53/53 green |
| **UI** | ✅ Full route set on Deshi design system (`docs/ui_prompt.md` + `docs/ui-design-system.md`); legacy HabitForge routes/components deleted; `/dev/components` gallery |
| **Convex Deployment** | ✅ `dev:disciplined-zebra-716` (project `habitforge`); schema v2 live (profiles/foods/mealLogs/activityLogs/budgetState/weighIns/auditLogs) |
| **AI (Groq)** | ✅ `GROQ_API_KEY` on Convex; chat model `openai/gpt-oss-120b`; vision plan `qwen/qwen3.8-27b` (probe); embeddings `nomic-embed-text-v1_5` (probe Bangla) |
| **P0 product surface** | 🔄 Onboarding + `/log` use Convex; `/log` has 318-food offline search and live CRUD; plan/coach still on fixtures |
| **Deployment** | ⬜ Not deployed to Vercel |
| **Browser testing** | ⬜ Pending human click-through (`bun dev`) + real-device mobile pass |
| **Last Updated** | 2026-11-02 (Wave 2 core logging + 318-food reconciliation verified) |

### Wave 1 gate (Nov 2, 2026) — MET

- **Engine:** `src/lib/engine/{types,energy,safety,rebalance,adaptive,index}.ts` — pure TS shared client+Convex
- **Tests:** `bun test src/lib/engine/engine.test.ts` → **27 pass / 0 fail** (~150k assertions, 5000-case property test)
- **Hand-check:** 70 kg, 40 min @ 4.3 MET → **154 kcal net** ✓
- **Six safety profiles (unit + Convex `profile:save` smoke):** normal / under-18→doctor-first / low BMI→restricted / insulin→doctor-first / ED history→doctor-first / pregnancy→doctor-first
- **Schema v2 live:** profiles (engine-derived `safetyMode`, Asian BMI), foods, mealLogs, activityLogs, budgetState, weighIns, auditLogs; habit tables dropped
- **Foods:** Wave 1 gate originally used 171 rows; Wave 2 now has **318** reconciled rows — FCTB 111, estimated-recipe 162, estimated 23, borrowed 21, measured 1
- **Onboarding:** final step → `api.profile.save` (deterministic safetyMode server-side); energy query returns BMR/TDEE/floor
- **Privacy:** `privacy:deleteMyData` + audit trail live
- **LLM scaffold:** `ai:chat` (privacy-safe context only), `ai:parseMeal` (top-5 candidate pick — W2)

### Wave 2 progress (Nov 2, 2026)

- `convex/mealLogs.ts`: live `listByDate`, `listRecent`, `create`, `update`, `remove`, `copyMeal`, `daySummary`; bounded indexed reads, return validators, profile-key checks
- `/log`: bundled offline Bangla/English/Banglish alias search; code-only gram/kcal ranges; Convex create/list/delete; Groq parser with offline fallback
- Food seed: **318 unique rows**, stale seeded names reconciled safely, indexed Bangla/English server search; 3 regression tests prevent duplicate/invalid rows
- Parser: **20 deterministic lines pass**; live Groq smoke selected bhat/dal/alu bhorta/dim exactly from 14 candidates
- Shared pot: 1000 g dal × 1/5 = 200 g; deterministic range test + UI pass
- Smoke: create → list → copy → summary → wrong-key rejection → cleanup passed on `dev:disciplined-zebra-716`
- Verification: **53 tests**, lint 0 errors (4 generated warnings), root + Convex TypeScript pass, production build passes
- Remaining W2 gate: five assisted-photo tests; spoon-based shared-pot entry and other W2 enhancements remain

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

**Probes first (30 min each):** Qwen vision on 10 plate photos · Bangla/Banglish on Groq embeddings · Chrome `bn-BD` speech.

**Wave 1 (foundation):** ✅ Complete. Engine, safety modes, onboarding/profile, consent/delete-data, schema and tagged food seed passed their gate.

**Wave 2 now:** manual logging + 318-food search + meal CRUD ✅; next are parser evaluation, shared-pot math, assisted photo flow, rice calibration and recipes.

**Then waves in order:** W3 tracking + balance engine UI → W4 activity → W5 RAG coach → W6 personalisation → W7 offline/PWA/admin → W8 proof/deploy/deck.

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
- [ ] Wire `ai.parseMeal` into `/log` and evaluate 20 Banglish lines
- [ ] Implement shared-pot fraction-to-grams calculation and test dal example
- [ ] Wire assisted photo confirmation flow and test five plates
- [ ] Complete rice calibration and recipe persistence

### Medium Priority
- [ ] Wire recents/copy-meal UI to the live backend
- [ ] Add favourites and report-wrong review queue
- [ ] Probe Chrome `bn-BD` voice input
- [ ] Begin W3 budget-state UI integration

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
| Shared-pot, photo and parser gates incomplete | High | Medium — remaining Wave 2 work |
| No authentication; profile key is demo-only | High | Medium — add Convex Auth before multi-user launch |
| AI responses not cached | Low | Low — add Convex caching if rate-limited |

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
Wave 2 █████████████████░░░░░░░   70% — Core/parser/shared-pot live; photo gate pending
Wave 3 ░░░░░░░░░░░░░░░░░░░░░░░░    0% — Tracking + balance UI
Wave 4 ░░░░░░░░░░░░░░░░░░░░░░░░    0% — Activity
Wave 5 ░░░░░░░░░░░░░░░░░░░░░░░░    0% — RAG coach
Wave 6–8 ░░░░░░░░░░░░░░░░░░░░░░    0% — Personalisation, offline/admin, proof
```

---

*Last updated: November 2, 2026 — Build Plan v3 (full-scope waves) adopted across all docs*
