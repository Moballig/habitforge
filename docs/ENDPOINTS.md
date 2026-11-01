# Deshi Health Companion — Backend Functions Documentation

**Version:** 3.3 (aligned with Build Plan v3 — Wave 2 in progress)
**Last Updated:** November 2, 2026
**Backend:** Convex + shared `lib/engine/` | **Deployment:** `dev:disciplined-zebra-716` (project `habitforge`)
**URL:** `https://disciplined-zebra-716.ap-southeast-2.convex.cloud`
**Source of truth:** `docs/bangladeshi-calorie-companion-research.md`; build order in `docs/IMPLEMENTATION_PLAN.md`

---

## Overview

| Where | What |
|-------|------|
| **`src/lib/engine/`** | Pure TS deterministic functions (`bmr`, `tdee`, `metNetKcal`, `safetyMode`, `rebalance`, `adaptiveTdee`) — **shared by client and Convex**, unit + property tested, **no LLM** |
| **`convex/`** | Tables, queries, mutations, actions (LLM/vision/embedding side effects) |
| **Client** | Fuzzy search over bundled food JSON (top-5 candidates); `useQuery`/`useMutation`/`useAction` |

| Module | Status | Purpose | Wave |
|--------|--------|---------|------|
| `lib/engine` | ✅ Done | BMR/TDEE/MET/safetyMode/rebalance/adaptiveTdee — 27 tests, property-tested | W1 |
| `convex/schema` | ✅ Done (v2 live) | profiles, foods, mealLogs, activityLogs, budgetState, weighIns, auditLogs | W1 |
| `convex/profile` | ✅ Done | `get`, `save`, `energy` — engine computes safetyMode server-side | W1 |
| `convex/foods` | ✅ Done | Reconciled seed, full-text BN/EN search, get/count/upsert — 318 rows live | W1–2 |
| `convex/privacy` | ✅ Done | `recordConsent`, `deleteMyData`, `auditTrail` | W1 |
| `convex/ai` | ✅ Base scaffold | `chat` (privacy-safe), `parseMeal` (top-5 candidate pick) | W2/5 |
| `convex/mealLogs` | ✅ Core live | List/create/update/remove/copy/day summary; profile-key checks | W2 |
| `convex/budget` | ⬜ Planned | 7-day budget, overshoot, spread plan (engine-backed) | W3 |
| `convex/activity` | ⬜ Planned | MET logging, manual steps | W4 |
| `convex/rag` | ⬜ Planned | `ctx.vectorSearch` + keyword merge (action only) | W5 |
| `convex/weights` | ⬜ Planned | Weigh-ins, adaptive TDEE inputs | W3 |
| `convex/prices` | ⬜ Planned | Bazar prices, taka queries | W5–6 |
| `convex/admin` | ⬜ Planned | Foods/recipes/prices CRUD, report queue | W7 |

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
  kcalPer100: number, proteinPer100: number,
  carbPer100: number, fatPer100: number, fiberPer100?: number,
  measures: { label: string, grams: number }[],  // bati-s, spoon, glass, piece, plate-quarter…
  sourceTag: "measured" | "fctb" | "borrowed" | "user" | "estimated" | "estimated-recipe" | "ai-assisted",
  isCooked: boolean,
  rangeLow?: number, rangeHigh?: number,   // uncertain nutrients (Ali & Amin)
  regionTags?: string[],
}
```

**Current seed:** 318 unique demo rows with source tags and plate-ready recipes. `estimated-recipe` rows show ranges. FCTB-tagged values still require D1 source-row verification before production claims.

### Other tables

`measures` (kitchen-scale standards D4) · `mealLogs` · `profiles` (+ safetyScreen, safetyMode, plate/rice calibration) · `healthMeasures` · `activityLogs` (+ manual steps) · `budgetState` · `priceRecords` (D6) · `ragChunks` (**vectorIndex**, section+page metadata) · `auditLogs`.

**Indexes:** by date, by user, by food — all hot paths. Vector search **only from actions**.

---

## 3. Convex Queries & Mutations (current — Wave 2 in progress)

### `profile` (Wave 1 — ✅ live)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `profile.get` | query | `key?` | Profile row or null | Key defaults to `"default"` |
| `profile.save` | mutation | demographics + screening + consent | `{ id, safetyMode, asianBmiBand }` | Engine computes `safetyMode` server-side |
| `profile.energy` | query | `key?` | `{ bmrKcal, tdeeKcal, floorKcal, allowsDeficit, ... }` | Deterministic; no LLM |

### `foods` (Wave 1–2 — ✅ live, 318 rows)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `foods.seed` | mutation | — | `{ inserted, updated, removedStale, total, skipped }` | Idempotent reconciliation; public for demo |
| `foods.seedAll` | internalMutation | — | Same | Internal use |
| `foods.count` | query | — | `{ total, byTag }` | Source-tag breakdown |
| `foods.search` | query | `q`, `limit?` | Food[] | Indexed Bangla/English name search; bundled client seed adds alias/offline search |
| `foods.getById` | query | `id` | Food row | |
| `foods.upsert` | mutation | food row | id | Admin/seed |

### `privacy` (Wave 1 — ✅ live)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `privacy.recordConsent` | mutation | `key?`, `accepted` | `{ ok }` | Writes audit log |
| `privacy.deleteMyData` | mutation | `key?`, `confirm: "DELETE"` | `{ ok, deleted }` | Purges all user tables |
| `privacy.auditTrail` | query | `key?` | AuditLog[] | Last 50 entries |

### `mealLogs` (Wave 2 — ✅ core live)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `mealLogs.listByDate` | query | `key?`, `date` | Bounded day view |
| `mealLogs.listRecent` | query | `key?`, `limit?` | Recent meals for recents/copy UI |
| `mealLogs.create` | mutation | `key?`, date, slot, items[], method, time? | Validates positive portions and kcal ranges |
| `mealLogs.update` | mutation | `key?`, id, items?/slot?/date? | Always editable; key ownership check |
| `mealLogs.remove` | mutation | `key?`, id | Key ownership check |
| `mealLogs.copyMeal` | mutation | `key?`, sourceId, targetDate/slot? | "Same as yesterday" backend |
| `mealLogs.daySummary` | query | `key?`, date | Meal count, kcal range, totals by slot |

### `budget` / plan (Wave 3 — ⬜ planned)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `budget.state` | query | date | 7-day rolling state |
| `budget.plan` | mutation | controls | Calls `engine.rebalance`; Bangla/EN templates |
| `budget.whatIf` | query | proposedIntake | Simulator (P1) |
| `weights.add` / `weights.trend` | mutation/query | — | Adaptive TDEE inputs |

### `activity` (Wave 4 — ⬜ planned)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `activity.create` | mutation | type, duration | MET via engine; net-calorie logic |
| `activity.listByDate` | query | `date` | |
| `activity.addSteps` | mutation | count | Manual steps (web substitute) |

### `rag` (Wave 5 — ⬜ planned)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `rag.search` | **action** | `query`, `lang?` | Embed + `ctx.vectorSearch` + keyword merge |
| `rag.ingest` | mutation | source doc | Chunk 300–600 tokens; section + page metadata |

---

## 4. AI Actions (`convex/ai.ts` — base scaffold)

All run in Convex actions (`"use node"`) via `groqChat()`. **Privacy hard rule:** never send age/weight/name/conditions to Groq — only food text, question, and safe categories (`mode=restricted`) set by code.

### 4.1 `ai.chat` (Wave 5 — RAG coach)

```ts
await chatAction({
  message: "diabetes thakle bhat koto khabo?",
  safeContext: { mode: "normal", goal: "gentle-change", lang: "bn" },
});
// → { response } | { error }
```

Pipeline (Wave 5): rewrite → embed → `ctx.vectorSearch` + keyword merge → Groq with chunks + tools → **number validator** → answer + `Source: <section>`. Refuse below similarity threshold.

**Current (W1 scaffold):** privacy-safe system prompt only; no RAG, no sources yet.

### 4.2 `ai.parseMeal` (Wave 2 — ✅ wired; LLM chooses, code computes)

```ts
await parseMealAction({
  line: "dupure bhat, dal, alu bhorta, mach",
  candidates: [{ id, nameBn, nameEn, aliases }, ...],  // top-5 per phrase from client fuzzy search
});
// → { picks: [{ id, qty, unit }], notes? } | { error }
```

JSON mode with a maximum 25-item candidate pool. Returned IDs are checked against that pool; quantity is bounded to `0 < qty ≤ 20`; units are length-bounded. Code converts units → grams via `measures` and computes kcal. On Groq failure, `/log` uses the deterministic offline top candidate per clause. The 20-case local parser set and a live four-item Groq smoke pass.

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
