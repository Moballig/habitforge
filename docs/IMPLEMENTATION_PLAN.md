# HabitForge — Full Implementation Plan

**Project:** HabitForge — AI Habit Tracker & Accountability Coach
**Buildathon:** Ostad Presents YUNet AIgnite Buildathon 2026
**Timeline:** November 1–5, 2026 (5 days)
**Stack:** Next.js 16 + Tailwind CSS 4 + **Convex** + Gemini API + Vercel

---

## Executive Summary

HabitForge is an AI-powered habit tracking web app that goes beyond simple checkbox tracking. It uses Google Gemini AI to provide personalized coaching, habit suggestions based on user goals, and intelligent weekly progress analysis. The app targets students who want to build consistent routines but lack accountability and adaptive guidance.

---

## Phase 1: Foundation (Day 1 — Nov 1) ✅

> **Closed 2026-11-01 21:00 BST.** All tasks done. During closure the storage layer was
> migrated from localStorage + Next.js API routes to **Convex** (schema, queries/mutations,
> AI actions). Dead code removed (`src/app/api/*`, `lib/storage.ts`, `lib/analytics.ts`,
> `lib/gemini.ts`). `bun run build` ✅ · lint 0 errors ✅ · Convex deployed ✅.
> **Open external issue:** Gemini returns 403 (free tier unavailable for the user's Google
> project) — needs billing or a new API key; AI degrades gracefully until then.
> Analytics task 1.5/1.15 files changed: stats now live in `src/hooks/useHabits.ts`,
> AI in `convex/ai.ts`.

### Objectives
Set up the project, build core data layer, and implement the main dashboard.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 1.1 | Initialize Next.js 16 project with Bun | ✅ Done | `package.json` |
| 1.2 | Install dependencies: `@google/generative-ai`, `lucide-react`, `convex` | ✅ Done | `package.json` |
| 1.3 | Define TypeScript types & constants | ✅ Done | `src/lib/types.ts` |
| 1.4 | Build persistence layer (localStorage CRUD → **Convex tables/mutations**) | ✅ Done | `convex/schema.ts`, `convex/habits.ts`, `convex/habitLogs.ts` |
| 1.5 | Build analytics/stats calculation engine | ✅ Done | `src/hooks/useHabits.ts` (streaks, rates, 7-day trend) |
| 1.6 | Build Gemini AI integration (**Convex actions**) | ✅ Done | `convex/ai.ts` (chat, suggest, analyze) |
| 1.7 | Build `useHabits` custom hook | ✅ Done | `src/hooks/useHabits.ts` |
| 1.8 | Build Navbar with buildathon sticker | ✅ Done | `src/components/Navbar.tsx` |
| 1.9 | Build HabitCard component | ✅ Done | `src/components/HabitCard.tsx` |
| 1.10 | Build AddHabitModal component | ✅ Done | `src/components/AddHabitModal.tsx` |
| 1.11 | Build HabitGrid (GitHub-style) | ✅ Done | `src/components/HabitGrid.tsx` |
| 1.12 | Build StatsCards component | ✅ Done | `src/components/StatsCards.tsx` |
| 1.13 | Build Dashboard page | ✅ Done | `src/app/page.tsx` |
| 1.14 | Update global styles & layout | ✅ Done | `src/app/globals.css`, `layout.tsx`, `ConvexClientProvider.tsx` |
| 1.15 | Build AI endpoints (coach, analyze, suggest) | ✅ Done | `convex/ai.ts` *(was `src/app/api/*/route.ts` — removed in Convex migration)* |
| 1.16 | Build AI Coach page | ✅ Done | `src/app/coach/page.tsx` |
| 1.17 | Create project documentation | ✅ Done | `docs/*` |

### Deliverables
- ✅ Working dashboard with habit CRUD (realtime via Convex)
- ✅ AI Coach page with chat and suggestions (blocked on Google billing for live responses)
- ✅ All AI functions implemented (`chat`, `suggest`, `analyze`)
- ✅ Complete documentation suite (updated for Convex architecture)
- ✅ `bun run build` green, lint clean, Convex functions deployed

---

## Phase 2: Analytics & AI Reports (Day 2 — Nov 2) ✅

> **Closed 2026-11-01 21:15 BST** (completed early, Day 1 night). Charts are CSS-only (no
> chart library). `bun run build` ✅ with `/analytics` route, lint 0 errors, all pages HTTP 200
> on `next start`. **Open:** live AI responses still blocked by Gemini 403 (Google billing) —
> error/fallback paths verified instead.

### Objectives
Build the analytics page, implement AI-powered weekly reports, and add the 7-day trend chart.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 2.1 | Build Analytics page layout | ✅ Done | `src/app/analytics/page.tsx` |
| 2.2 | Build per-habit analytics cards | ✅ Done | `src/components/HabitAnalyticsCard.tsx` |
| 2.3 | Build 7-day completion bar chart | ✅ Done | `src/components/WeeklyChart.tsx` |
| 2.4 | Integrate AI weekly report generation | ✅ Done | `src/components/AIReport.tsx` (via `api.ai.analyze`) |
| 2.5 | Add category distribution visualization | ✅ Done | `src/components/CategoryChart.tsx` |
| 2.6 | Connect analytics page to useHabits hook | ✅ Done | `src/app/analytics/page.tsx` |
| 2.7 | Test AI Coach with various prompts | ⚠️ Blocked | Gemini 403 (Google billing) — needs user key/billing fix |
| 2.8 | Fix any bugs from Day 1 | ✅ Done | Fixed `HabitCard` import, Next 16 prerender `new Date()`, retired `gemini-2.0-flash` model |

### Deliverables
- ✅ Analytics page with charts and per-habit stats
- ✅ AI-powered weekly report generation (error/fallback handling verified)
- ✅ Bug fixes from Day 1

---

## Phase 3: Polish & UX (Day 3 — Nov 3) ✅

> **Closed 2026-11-01 21:35 BST** (completed early, Day 1 night). `bun run build` ✅,
> lint 0 errors ✅ (only warnings in generated files), all routes HTTP 200 ✅.
> **Open:** real-device mobile testing still pending (needs human).

### Objectives
Polish UI/UX, add animations, implement dark mode toggle, and ensure responsive design across all breakpoints.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 3.1 | Add confetti/celebration animation on habit completion | ✅ Done | `src/components/Confetti.tsx` (pure seeded RNG — no deps, fires when all daily habits complete) |
| 3.2 | Add dark/light mode manual toggle | ✅ Done | `src/components/ThemeToggle.tsx` + class-based `@custom-variant` + no-FOUC inline script |
| 3.3 | Improve mobile responsiveness (320px–768px) | ⚠️ Code reviewed | Responsive classes verified (navbar hamburger, modals, grids); **needs real-device pass** |
| 3.4 | Add habit editing functionality | ✅ Done | `src/components/EditHabitModal.tsx` + Edit item in HabitCard menu (uses existing `habits.update`) |
| 3.5 | Add empty states and loading skeletons | ✅ Done | Dashboard skeleton, empty states on Dashboard + Analytics |
| 3.6 | Add toast notifications for actions | ✅ Done | `src/components/Toast.tsx` (context provider, `aria-live`, 3s auto-dismiss) |
| 3.7 | Improve accessibility (focus states, ARIA labels) | ✅ Done | Global `:focus-visible`, `role=dialog` + Escape, `aria-pressed`/`aria-label`/`aria-expanded`, radiogroups, labeled inputs |
| 3.8 | Add category color-coding throughout the app | ✅ Done | AI suggestion dots, per-habit cards, badges, progress bars |
| 3.9 | Add onboarding/welcome screen for new users | ✅ Done | Covered by guided empty states on Dashboard & Analytics (no separate screen needed) |

### Deliverables
- ✅ Polished, production-quality UI
- ✅ Smooth animations and transitions (scale/fade/toast/confetti)
- ✅ Manual dark mode toggle with no flash-of-wrong-theme
- ✅ Accessibility improvements (keyboard focus, ARIA, Escape, live regions)

---

## Phase 4: Deployment & Testing (Day 4 — Nov 4)

### Objectives
Deploy to Vercel, thoroughly test all features, fix critical bugs, and optimize performance.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 4.1 | Create GitHub repository | ⬜ TODO | — |
| 4.2 | Push code to GitHub | ⬜ TODO | — |
| 4.3 | Connect to Vercel and deploy | ⬜ TODO | — |
| 4.4 | Set `GEMINI_API_KEY` in Vercel environment variables | ⬜ TODO | — |
| 4.5 | Test deployed version end-to-end | ⬜ TODO | — |
| 4.6 | Test on mobile devices (real devices) | ⬜ TODO | — |
| 4.7 | Run Lighthouse audit and fix issues | ⬜ TODO | — |
| 4.8 | Fix all critical and major bugs | ⬜ TODO | — |
| 4.9 | Add SEO meta tags and OG image | ⬜ TODO | `src/app/layout.tsx` |
| 4.10 | Add README.md with setup instructions | ⬜ TODO | `README.md` |
| 4.11 | Add nice-to-have features if time permits | ⬜ TODO | Various |

### Deliverables
- Live production deployment on Vercel
- All critical bugs fixed
- Performance optimized (Lighthouse 90+)
- README with setup instructions

---

## Phase 5: Submission (Day 5 — Nov 5)

### Objectives
Final polish, create presentation deck, record optional demo video, and submit.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 5.1 | Final round of bug fixes | ⬜ TODO | — |
| 5.2 | Create 5-slide presentation deck | ⬜ TODO | — |
| 5.3 | Slide 1: Problem Statement | ⬜ TODO | — |
| 5.4 | Slide 2: Proposed Solution (HabitForge) | ⬜ TODO | — |
| 5.5 | Slide 3: How It Works (architecture + demo) | ⬜ TODO | — |
| 5.6 | Slide 4: Your Introduction / Background | ⬜ TODO | — |
| 5.7 | Slide 5: Key Features & Tech Stack | ⬜ TODO | — |
| 5.8 | Record demo video (optional, in English) | ⬜ TODO | — |
| 5.9 | Upload video to YouTube (if recorded) | ⬜ TODO | — |
| 5.10 | Submit: Live URL + Deck + Video link | ⬜ TODO | — |
| 5.11 | Final deployment verification | ⬜ TODO | — |

### Deliverables
- ✅ Live Web App URL
- ✅ 5-slide Presentation Deck
- ⬜ Demo Video (YouTube, optional)

---

## Feature Priority Matrix

| Feature | Impact | Effort | Priority | Phase |
|---------|--------|--------|----------|-------|
| Habit CRUD (create, toggle, delete) | 🔴 High | Low | **P0** | 1 ✅ |
| Streak tracking | 🔴 High | Low | **P0** | 1 ✅ |
| AI Coach chat | 🔴 High | Medium | **P0** | 1 ✅ |
| Dashboard with stats | 🔴 High | Medium | **P0** | 1 ✅ |
| Activity grid | 🟡 Medium | Medium | **P1** | 1 ✅ |
| AI habit suggestions | 🔴 High | Low | **P0** | 1 ✅ |
| Analytics page | 🟡 Medium | Medium | **P1** | 2 |
| AI weekly report | 🟡 Medium | Low | **P1** | 2 |
| Completion charts | 🟡 Medium | Medium | **P1** | 2 |
| Dark mode toggle | 🟢 Low | Low | **P2** | 3 |
| Animations/celebrations | 🟢 Low | Low | **P2** | 3 |
| Habit editing | 🟡 Medium | Low | **P2** | 3 |
| Toast notifications | 🟢 Low | Low | **P2** | 3 |
| PWA support | 🟢 Low | Medium | **P3** | 4 |
| Data export (PDF) | 🟢 Low | Medium | **P3** | 4 |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Gemini API rate limits hit | Low | Medium | Use free tier wisely; cache responses; fallback defaults |
| Gemini API downtime | Low | High | App works for tracking without AI; show friendly error |
| Convex free tier limits hit | Low | Medium | App is single-user demo scale; well within quota |
| Convex downtime | Low | High | Rare; AI-independent tracking also depends on it — acceptable for demo |
| Vercel deployment issues | Low | High | Test deploy early (Day 2); have backup plan |
| Scope creep | High | High | Stick to priority matrix; nice-to-haves are last |
| Mobile responsiveness bugs | Medium | Medium | Test on real devices early; use responsive DevTools |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| All P0 features working | ✅ |
| All P1 features working | By Day 3 |
| Deployed and accessible | By Day 4 |
| Lighthouse Performance score | 90+ |
| No critical bugs in production | By Day 5 |
| Presentation deck complete | Day 5 |
| Submission complete | Nov 5, 2026 |

