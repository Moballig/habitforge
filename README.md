# Deshi Health Companion

Bangladesh-first calorie, diet & exercise-balancing app with a RAG-grounded AI coach. Built for the Ostad Presents YUNet AIgnite Buildathon 2026 (Nov 1–5, 2026).

Formerly HabitForge (AI Habit Tracker); product scope follows [`docs/bangladeshi-calorie-companion-research.md`](docs/bangladeshi-calorie-companion-research.md).

## Stack

- **Next.js 16** (App Router, Bun) + Tailwind v4
- **Convex** backend (`convex/`) — dev deployment `dev:disciplined-zebra-716`
- **Groq** for chat/vision (`GROQ_API_KEY` on Convex); **local** `Xenova/multilingual-e5-small` embeddings via `/api/embed`
- Pure-TS deterministic engine in `src/lib/engine/` — shared by client and Convex; 98-test suite, no untraced LLM numbers
- Wave 5 RAG gate: **20/20** expected-source retrieval, **10/10** unsafe refusals, numeric trace validator

## First-time setup

```bash
bun install
bunx convex login
mkdir -p .tmp
CONVEX_TMPDIR="$PWD/.tmp" bunx convex env set GROQ_API_KEY=your_groq_key
```

## Start development

Run these in **two separate visible terminals**. Keep both terminals open; do not use `nohup`, `setsid`, or append `&`.

**Terminal 1 — Convex backend**

```bash
CONVEX_TMPDIR="$PWD/.tmp" bunx convex dev
```

Wait for `Convex functions ready!`.

**Terminal 2 — Next.js frontend**

```bash
bun run dev
```

Wait for `Ready`, then open <http://localhost:3000>. Stop each server with `Ctrl+C` in its terminal.

### Stale frontend after an update

The service worker is production-only. Development automatically unregisters older workers and clears `deshi-health-*` caches. If the browser was already open when this fix landed, reload once; if stale UI remains, clear site data for `localhost:3000` in browser DevTools and reload.

## Gates

```bash
npx tsc --noEmit   # root + convex types
bun run lint       # 0 errors
bun run test       # 98 engine/foods/AI tests
bun run build      # production build
```

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/CONTEXT.md`](docs/CONTEXT.md) | Living tracker — status, wave progress, known issues |
| [`docs/SRS.md`](docs/SRS.md) | Requirements + traceability table |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | 8 waves with exit gates |
| [`docs/ENDPOINTS.md`](docs/ENDPOINTS.md) | Convex functions reference |
| [`docs/deferred.md`](docs/deferred.md) | Everything consciously not built yet |
