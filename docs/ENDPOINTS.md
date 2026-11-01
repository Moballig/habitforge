# Deshi Health Companion — Backend Functions Documentation

**Version:** 3.1 (aligned with Build Plan v3)
**Last Updated:** November 2, 2026
**Backend:** Convex + shared `lib/engine/` | **Deployment:** `dev:disciplined-zebra-716` (project `habitforge`)
**URL:** `https://disciplined-zebra-716.ap-southeast-2.convex.cloud`
**Source of truth:** `docs/bangladeshi-calorie-companion-research.md`; build order in `docs/IMPLEMENTATION_PLAN.md`

---

## Overview

| Where | What |
|-------|------|
| **`lib/engine/`** | Pure TS deterministic functions (`bmr`, `tdee`, `metNetKcal`, `safetyMode`, `rebalance`, `adaptiveTdee`) — **shared by client and Convex**, unit + property tested, **no LLM** |
| **`convex/`** | Tables, queries, mutations, actions (LLM/vision/embedding side effects) |
| **Client** | Fuzzy search over bundled food JSON (top-5 candidates); `useQuery`/`useMutation`/`useAction` |

> Convex reserved words: avoid `get` as a query name (use `getByName`-style).

| Module | Status | Purpose | Wave |
|--------|--------|---------|------|
| `lib/engine` | ⬜ Planned | BMR/TDEE/MET/safetyMode/rebalance/adaptiveTdee | W1 |
| `convex/schema` | ⬜ Planned (v2 base exists) | foods, measures, mealLogs, profiles, activityLogs, budgetState, ragChunks (+ vectorIndex), … | W1 |
| `convex/profile` | ⬜ Planned | Onboarding, safety screen, Asian BMI, consent | W1 |
| `convex/foods` | ⬜ Planned | Deshi food DB search/get, recents, report-wrong | W1–2 |
| `convex/mealLogs` | ⬜ Planned | Text/photo/preset logging | W2 |
| `convex/budget` | ⬜ Planned | 7-day budget, overshoot, spread plan (engine-backed) | W3 |
| `convex/activity` | ⬜ Planned | MET logging, manual steps | W4 |
| `convex/ai` | ✅ Base exists → rework | chat (RAG), parseMeal, analyzePhoto, suggest… | W2/5 |
| `convex/rag` | ⬜ Planned | `ctx.vectorSearch` + keyword merge (action only) | W5 |
| `convex/weights` | ⬜ Planned | Weigh-ins, adaptive TDEE inputs | W3 |
| `convex/prices` | ⬜ Planned | Bazar prices, taka queries | W5–6 |
| `convex/admin` | ⬜ Planned | Foods/recipes/prices CRUD, report queue | W7 |
| `convex/privacy` | ⬜ Planned | delete-my-data, audit log | W1/7 |
| `convex/habits`, `habitLogs` | ⚠️ Legacy | **Routes deleted Wave 1**; drop tables when UI no longer reads them | W1 |

---

## Environment Variables

| Variable | Where set | Required | Description |
|----------|-----------|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` (git-ignored) | ✅ | Convex deployment URL for the client |
| `CONVEX_DEPLOYMENT` | `.env.local` (auto by `convex dev`) | ✅ | Active deployment selector |
| `GROQ_API_KEY` | **Convex env** | ✅ for AI | Groq API key (`gsk_...`) |
| `GROQ_MODEL` | Convex env (optional) | ❌ | Chat model override (default `openai/gpt-oss-120b`) |
| `GROQ_VISION_MODEL` | Convex env (optional) | ❌ | Photo model (default `qwen/qwen3.8-27b` — **re-check Groq docs before coding**) |
| `GROQ_EMBED_MODEL` | Convex env (optional) | ❌ | Embeddings (default `nomic-embed-text-v1_5` — **probe Bangla first**) |

### Setup

```bash
bunx convex login
bunx convex dev --once
bunx convex env set GROQ_API_KEY=your_groq_key
```

> [!CAUTION]
> Never commit `.env.local` or put `GROQ_API_KEY` in client-side code.

---

## 1. `lib/engine/` — deterministic core (Wave 1)

Pure functions, shared client + Convex. **LLM never produces these numbers.**

| Function | Signature (conceptual) | Notes |
|----------|------------------------|-------|
| `bmr` | `(profile) → kcal` | Mifflin-St Jeor (§5.1) |
| `tdee` | `(bmr, activityFactor) → kcal` | Replaced over time by adaptive estimate |
| `metNetKcal` | `(met, kg, hours) → net kcal` | `(MET − 1) × kg × hours`; hand-check: 70 kg, 40 min @ 4.3 MET ≈ **154 kcal** |
| `safetyMode` | `(screening) → normal \| restricted \| doctor_first` | §5.5 triggers; restricted **disables deficits + rebalance planner** |
| `rebalance` | `(state, controls) → plan` | 7-day budget, overshoot (tol 100 kcal), 3–7d window (default 4), 60/40 split, caps (net 200 kcal/d), floor = BMR, ±range; **Bangla/EN templates** for plan text |
| `adaptiveTdee` | `(weightTrend, intakeHistory) → { estimate, confidence }` | §5.3; honest "estimate improving" states |

**Tests:** `bun test` + property test — 5,000+ random overshoots: zero floor/cap violations, never 100% compensation.

---

## 2. Convex tables (schema sketch)

### `foods` (Wave 1–2)

```ts
{
  nameBn: string, nameEn: string,
  aliases: string[],            // Banglish spellings: bhorta, vorta, ভর্তা
  per100g: { kcal, protein, carb, fat, fiber?, micros? },
  measures: { label: string, grams: number }[],  // bati-s, spoon, glass, piece, plate-quarter…
  sourceTag: "measured" | "fctb" | "borrowed" | "user" | "estimated" | "estimated-recipe",
  isCooked: boolean,
  rangeLow?: number, rangeHigh?: number,   // uncertain nutrients (Ali & Amin)
  regionTags?: string[],
}
```

**Seed (D1–D3):** FCTB Excel → script → 150 hand-verified staples → grow to 300–500; **plate-ready recipe rows** (cooked rice, dal, bhorta, curries, khichuri, biriyani, tehari, ruti, paratha, singara, fuchka, milk tea, pitha, mishti) tagged `estimated-recipe`. Every row shows its tag in UI.

### Other tables

`measures` (kitchen-scale standards D4) · `mealLogs` · `profiles` (+ safetyScreen, safetyMode, plate/rice calibration) · `healthMeasures` · `activityLogs` (+ manual steps) · `budgetState` · `priceRecords` (D6) · `ragChunks` (**vectorIndex**, section+page metadata) · `auditLogs`.

**Indexes:** by date, by user, by food — all hot paths. Vector search **only from actions**.

---

## 3. Queries & mutations (planned)

### `foods`

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `foods.search` | query | `q`, `limit?` | Fuzzy + alias; client also searches bundled JSON offline |
| `foods.getByName` | query | `id` | Single food |
| `foods.listRecents` / `listFavorites` | query | — | §6-B |
| `foods.upsert` | mutation | row | Admin/seed; `sourceTag` required |
| `foods.reportWrong` | mutation | `foodId`, `note` | Review queue (§6-K) |

### `mealLogs` (Wave 2)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `mealLogs.listByDate` | query | `date` | Day view |
| `mealLogs.create` | mutation | items[], method | After user confirms parse/photo result |
| `mealLogs.update` / `remove` | mutation | id | Always editable |
| `mealLogs.copyMeal` | mutation | sourceId, date | "Same as yesterday" |

### `profile` (Wave 1)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `profile.get` | query | — | Current profile |
| `profile.upsert` | mutation | demographics, goal, pace, eatingStyle?, budgetBand?, household?, routine?, homeRegion? | Onboarding |
| `profile.safetyScreen` | mutation | answers | → `safetyMode` via **engine** (not LLM) |
| `profile.saveRiceCalibration` | mutation | plate/bowl, rice portion | Rice calibrator |
| `profile.asianBmi` | query | — | 23/27.5 + waist + WHtR |

### `budget` / plan (Wave 3 — engine-backed)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `budget.state` | query | date | 7-day rolling state |
| `budget.plan` | mutation | controls (window, split, exercise prefs) | Calls `engine.rebalance`; **templates** for Bangla/EN text |
| `budget.whatIf` | query | proposedIntake | Simulator (P1) |
| `weights.add` / `weights.trend` | mutation/query | — | Adaptive TDEE inputs |

### `activity` (Wave 4)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `activity.create` | mutation | type, duration | MET via engine; net-calorie logic |
| `activity.listByDate` | query | `date` | |
| `activity.addSteps` | mutation | count | **Manual steps** (web substitute — no phone sensor access) |

### `rag` (Wave 5)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `rag.search` | **action** | `query`, `lang?` | Rewrite → embed → **`ctx.vectorSearch`** + keyword/alias merge → chunks + scores |
| `rag.ingest` | mutation | source doc | Chunk 300–600 tokens; metadata section + page |

---

## 4. AI actions (`convex/ai.ts` — base exists, reworked per wave)

All run in Convex actions (`"use node"`) via `groqChat()`. **Privacy hard rule:** never send age/weight/name/conditions to Groq — only food text, question, and safe categories (`mode=restricted`) set by code.

### 4.1 `ai.chat` (Wave 5 — RAG coach)

```ts
await chatAction({
  message: "diabetes thakle bhat koto khabo?",
  safeCategories: { mode: "normal" },  // set by code from safetyMode — NOT raw profile
});
// → { response, sources: [{ section, page }] } | { error }
```

Pipeline: rewrite query to English → `rag.search` → Groq with chunks + tools → **number validator** (every number must appear in tool result or chunk; else regenerate once → template fallback) → answer + `Source: <section>`. Refuse below similarity threshold.

### 4.2 `ai.parseMeal` (Wave 2 — LLM chooses, code computes)

```ts
await parseMealAction({
  text: "dupure bhat, dal, alu bhorta, mach",
  candidates: [{ foodId, nameEn, nameBn }, ...],  // top-5 per phrase from client fuzzy search
});
// → { items: [{ foodId, quantity, unit }] } | { error }
```

JSON mode; **may not invent foods or numbers**. Code converts units → grams via `measures` and computes kcal. On failure → client shows **tap-to-pick** list. ≤1 clarifying question when top-2 candidates differ a lot in calories.

### 4.3 `ai.analyzePhoto` (Wave 2 — assisted)

```ts
await analyzePhotoAction({
  images: [...],            // ≤3, qwen/qwen3.8-27b JSON mode
  supportedFoods: [...],    // compact id+name list
  platePreset: "medium",    // from profile calibration
});
// → { items: [{ foodId, portionClass: "small"|"medium"|"large", confidence }] }
```

Code maps portionClass → grams via plate preset → kcal **with range** → confirm/edit screen. If probe fails on mixed dishes: ship pre-tested demo photos only and say so on stage.

### 4.4 Other actions (later waves)

| Action | Wave | Behaviour |
|--------|------|-----------|
| `ai.mealFit` | W3 | What-if simulator wrapper (engine numbers) |
| `ai.swaps` | W5 | Smart swaps + one-line why (templates + chunks) |
| `ai.cheapProtein` | W5 | Protein per taka from `priceRecords` |
| `ai.weeklyReview` | W5 | Friendly review, no scolding |

### 4.5 Legacy (existing, to rework/delete)

`ai.chat` (habit coach), `ai.suggest`, `ai.analyze` — Groq REST works; prompts/scope change with the pivot.

---

## Error Handling Strategy

| Failure | Behavior |
|---------|----------|
| Bad arguments | Convex validators reject before handler |
| Groq error / rate limit | `{ error }` or **local fallback** (tap-to-pick, cached answer, templates); logging + engine unaffected |
| Model returns non-JSON | Fallback list / template (still success where safe) |
| Number validator fails | Regenerate once → **template answer** (never show unsourced numbers) |
| Retrieval below threshold | **Refuse** + suggest professional (§7.2) |
| Offline | Parser → tap-to-pick; coach/photo offline-only; plan + logging work from IndexedDB + `lib/engine` |

**Food logging, plan, and engine must always work — even when AI is down or offline** (§6-I, Plan v3 §0).

---

## Rate Limits & Quotas

| Constraint | Notes |
|-----------|-------|
| Groq free tier | Cache demo answers; pre-warm calls; tap-to-pick fallback |
| Convex free tier | Fine for demo scale; index everything; vector search in actions only (≤256 results) |
| Payload | Photos compressed client-side (data-saver); food JSON bundled |

---

## Local Development

```bash
bun run dev              # Next.js on :3000
bunx convex dev          # watches convex/ and redeploys
bun test                 # lib/engine unit + property tests

# Direct tests:
bunx convex run foods:search '{"q":"bhorta"}'
bunx convex run ai:parseMeal '{...}'
bunx convex run rag:search '{"query":"diabetes rice portion"}'
```
