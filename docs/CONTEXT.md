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
| **Current Phase** | Phase 1 — Foundation |
| **Day** | Day 1 (Nov 1, 2026) |
| **Build Status** | 🟡 In Progress (not yet tested locally) |
| **Deployment** | ⬜ Not deployed |
| **Last Updated** | 2026-11-01 20:00 BST |

---

## 🏗️ What's Been Built

### Day 1 — November 1, 2026

**Session 1 (19:46–20:05)**

| Time | Action | Result |
|------|--------|--------|
| 19:46 | Project ideation & planning | Selected HabitForge — AI Habit Tracker |
| 19:52 | Scaffolded Next.js 16 with Bun | ✅ Project initialized |
| 19:53 | Installed `@google/generative-ai`, `lucide-react` | ✅ Dependencies ready |
| 19:54 | Built core library layer | ✅ `types.ts`, `storage.ts`, `analytics.ts`, `gemini.ts` |
| 19:55 | Built React hook | ✅ `useHabits.ts` |
| 19:56 | Built UI components | ✅ Navbar, HabitCard, HabitGrid, StatsCards, AddHabitModal |
| 19:57 | Built API routes | ✅ `/api/coach`, `/api/analyze`, `/api/suggest` |
| 19:57 | Built pages | ✅ Dashboard (`page.tsx`), AI Coach (`coach/page.tsx`) |
| 19:58 | Updated layout & styles | ✅ `layout.tsx`, `globals.css` |
| 20:03 | Created documentation | ✅ SRS, Architecture, Endpoints, Implementation Plan |

**Files Created (18 total):**
- `src/lib/types.ts` — TypeScript interfaces & constants
- `src/lib/storage.ts` — localStorage CRUD utilities
- `src/lib/analytics.ts` — Streak & stats calculations
- `src/lib/gemini.ts` — Gemini API wrapper
- `src/hooks/useHabits.ts` — Habit state management hook
- `src/components/Navbar.tsx` — Nav with buildathon sticker
- `src/components/HabitCard.tsx` — Habit card with toggle
- `src/components/HabitGrid.tsx` — GitHub-style activity grid
- `src/components/StatsCards.tsx` — Dashboard stat cards
- `src/components/AddHabitModal.tsx` — New habit modal
- `src/app/layout.tsx` — Root layout
- `src/app/page.tsx` — Dashboard page
- `src/app/globals.css` — Global styles
- `src/app/coach/page.tsx` — AI Coach chat page
- `src/app/api/coach/route.ts` — AI chat endpoint
- `src/app/api/analyze/route.ts` — Habit analysis endpoint
- `src/app/api/suggest/route.ts` — Habit suggestions endpoint
- `docs/*` — Project documentation (5 files)

---

## 🔮 What's Next

### Immediate (Tonight / Day 2 Morning)
1. [ ] **Test the app locally** — `bun dev` and verify all features work
2. [ ] **Fix any build/runtime errors** — TypeScript, import issues, etc.
3. [ ] **Set up `.env.local`** with Gemini API key
4. [ ] **Build Analytics page** — `src/app/analytics/page.tsx`

### Day 2 Priorities
1. [ ] Analytics page with charts (bar chart, category distribution)
2. [ ] AI weekly report component
3. [ ] Per-habit analytics cards
4. [ ] Bug fixes from Day 1 testing

### Day 3 Priorities
1. [ ] Polish UI — animations, transitions, hover states
2. [ ] Dark mode toggle
3. [ ] Habit editing
4. [ ] Mobile testing & fixes

### Day 4 Priorities
1. [ ] Deploy to Vercel
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
| 1 | App not yet tested locally | 🔴 Critical | ⬜ Open | Need to run `bun dev` and verify |
| 2 | Analytics page not yet built | 🟡 Medium | ⬜ Open | Planned for Day 2 |
| 3 | No `.env.local` file yet | 🔴 Critical | ⬜ Open | Need Gemini API key |
| 4 | Dark mode is system-only (no toggle) | 🟢 Low | ⬜ Open | Planned for Day 3 |
| 5 | No habit editing (only create/delete) | 🟡 Medium | ⬜ Open | Planned for Day 3 |

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
- [ ] Add habit notes/journaling per completion
- [ ] Add social sharing of streaks

### Low Priority (Post-Buildathon)
- [ ] User authentication (Firebase/NextAuth)
- [ ] Cloud data sync across devices
- [ ] PWA with offline support
- [ ] Habit categories with custom colors
- [ ] Integration with Google Calendar

---

## 🎨 Design Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Nov 1 | localStorage over database | Simplicity; no auth needed; sufficient for demo |
| Nov 1 | Gemini 2.0 Flash over Pro | Faster responses; lower latency; free tier sufficient |
| Nov 1 | No auth/accounts for MVP | Time constraint; focus on core value prop |
| Nov 1 | CSS-based Tailwind v4 config | Next.js 16 default; no `tailwind.config.ts` needed |
| Nov 1 | Hook-based state over Redux/Zustand | App is simple enough; no global state library needed |
| Nov 1 | AI on server-side API routes only | Keep API key secure; never expose to client |

---

## 📊 Tech Debt

| Item | Impact | Effort to Fix |
|------|--------|---------------|
| No unit tests | Medium | Medium — add Jest/Vitest for analytics.ts |
| No input validation on API routes | Low | Low — add Zod schemas |
| No error boundary component | Medium | Low — add React error boundary |
| localStorage has 5–10MB limit | Low | N/A for demo scale |
| No loading states on API calls in analytics | Medium | Low — add suspense/loading |
| Chat history not persisted | Low | Low — save to localStorage |

---

## 🔑 Key Decisions Pending

| # | Decision | Options | Deadline |
|---|----------|---------|----------|
| 1 | Charting library for analytics | CSS-only bars vs. chart.js vs. recharts | Day 2 |
| 2 | Deploy URL / custom domain | Default Vercel URL vs. custom domain | Day 4 |
| 3 | Demo video recording tool | OBS vs. Loom vs. screen recording | Day 5 |

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
Day 1 ████████████████████░░░░░  80% — Foundation built, docs done
Day 2 ░░░░░░░░░░░░░░░░░░░░░░░░░  0%  — Analytics & AI reports
Day 3 ░░░░░░░░░░░░░░░░░░░░░░░░░  0%  — Polish & UX
Day 4 ░░░░░░░░░░░░░░░░░░░░░░░░░  0%  — Deploy & test
Day 5 ░░░░░░░░░░░░░░░░░░░░░░░░░  0%  — Submit
```

---

*Last updated: November 1, 2026 — 20:05 BST*

