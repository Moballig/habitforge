# HabitForge — Project Context & Improvement Tracker

**Project:** HabitForge — AI Habit Tracker & Accountability Coach
**Buildathon:** Ostad Presents YUNet AIgnite Buildathon 2026
**Timeline:** November 1–5, 2026

> [!IMPORTANT]
> This document is the **living tracker** for the project. Update it as decisions are made, bugs are found, features are completed, and improvements are identified.

---

## 📋 Quick Status

| Item | Status |
|------|--------|
| **Current Phase** | Phase 3 — Polish & UX |
| **Day** | Day 1 (Nov 1, 2026) — Phases 1 & 2 both closed |
| **Build Status** | ✅ `bun run build` passes, lint 0 errors, all routes HTTP 200 |
| **Convex Deployment** | ✅ `dev:disciplined-zebra-716` (project `habitforge`) |
| **AI (Gemini)** | 🟡 Key set, but Google returns **403 — free tier unavailable for this project** (needs billing or a new key from [AI Studio](https://aistudio.google.com/apikey)) |
| **Deployment** | ⬜ Not deployed to Vercel |
| **Browser testing** | ⬜ Pending human click-through (`bun dev`) |
| **Last Updated** | 2026-11-01 21:15 BST |

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

**Files (current):**
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
- `src/app/` — Dashboard, AI Coach, **Analytics**, layout, globals.css
- `docs/*` — Project documentation (5 files)

**Removed (superseded by Convex):**
- `src/app/api/{coach,analyze,suggest}/route.ts` — replaced by `convex/ai.ts` actions
- `src/lib/storage.ts`, `src/lib/analytics.ts`, `src/lib/gemini.ts` — logic moved into `useHabits.ts` / `convex/ai.ts`

---

## 🔮 What's Next

### Current — Phase 3 (Day 3): Polish & UX
1. [ ] Polish UI — animations, transitions, hover states
2. [ ] Dark mode toggle (`ThemeToggle.tsx` — currently system-only)
3. [ ] Habit editing UI (backend `habits.update` already exists — needs `EditHabitModal.tsx`)
4. [ ] Toast notifications for actions
5. [ ] Mobile testing & fixes (320px–768px)
6. [ ] Accessibility pass (focus states, ARIA labels)
7. [ ] Confetti on completing all daily habits

### Blocked on user
- [ ] **Gemini 403 billing issue** — either enable billing at https://aistudio.google.com/billing or generate a fresh key at https://aistudio.google.com/apikey and run `bunx convex env set GEMINI_API_KEY=<new_key>`
- [ ] **Browser click-through** — run `bun dev` and exercise Dashboard / Analytics / Coach with Convex connected

### Day 4 Priorities
1. [ ] Deploy to Vercel (set `NEXT_PUBLIC_CONVEX_URL` env var there)
2. [ ] End-to-end testing on production
3. [ ] Performance optimization (Lighthouse)
4. [ ] README.md

### Day 5 Priorities
1. [ ] Presentation deck (5 slides)
2. [ ] Demo video (optional)
3. [ ] Final submission

---

## 🐛 Known Issues & Bugs

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | App not yet tested in browser (`bun dev` manual click-through) | 🔴 Critical | ⬜ Open | Build/lint/smoke tests pass; needs human click-through with Convex |
| 2 | Gemini AI returns 403 (free tier not available for project) | 🔴 Critical | ⬜ Open | **User action:** billing or new API key — all AI features degrade gracefully meanwhile |
| 3 | AI report / coach responses untestable until #2 fixed | 🟡 Medium | ⚠️ Blocked by #2 | Error + fallback paths verified via `convex run` |
| 4 | Dark mode is system-only (no toggle) | 🟢 Low | ⬜ Open | Phase 3 |
| 5 | No habit editing UI (backend `habits.update` exists) | 🟡 Medium | ⬜ Open | Phase 3 |
| 6 | Chat history not persisted (session only) | 🟢 Low | ⬜ Open | Could save to localStorage or Convex |

---

## 💡 Improvement Ideas

### High Priority
- [ ] Add confetti animation when completing all daily habits
- [ ] Add "habit stacking" suggestions from AI (pair habits together)
- [ ] Add weekly streak badges/achievements
- [ ] Add data export functionality (JSON or PDF)

### Medium Priority
- [ ] Implement habit reminders (notification API)
- [ ] Add habit templates (pre-built habit collections)
- [ ] Add habit notes/journaling per completion (backend `habitLogs.addNote` exists)
- [ ] Add social sharing of streaks

### Low Priority (Post-Buildathon)
- [ ] User authentication (Convex Auth)
- [ ] Cross-device sync — **already free via Convex** 🎉
- [ ] PWA with offline support
- [ ] Habit categories with custom colors
- [ ] Integration with Google Calendar

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
| No unit tests | Medium | Medium — add Vitest for streak logic in `useHabits.ts` |
| No error boundary component | Medium | Low — add React error boundary |
| Chat history not persisted | Low | Low — save to localStorage or Convex |
| Stats computed in hook (duplicated vs lib) | Low | N/A — single source of truth now, keep |
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

## 📈 Daily Progress Chart

```
Day 1 ██████████████████████░░  100% — Foundation + Convex migration verified, build green
Day 2 ██████████████████████░░  100% — Analytics & AI reports (built early, Nov 1 night)
Day 3 ░░░░░░░░░░░░░░░░░░░░░░░░░  0%  — Polish & UX (next)
Day 4 ░░░░░░░░░░░░░░░░░░░░░░░░░  0%  — Deploy & test
Day 5 ░░░░░░░░░░░░░░░░░░░░░░░░░  0%  — Submit
```

---

*Last updated: November 1, 2026 — 21:15 BST*
