# Deshi Health Companion — Backend Functions Documentation

**Version:** 3.4 (aligned with Build Plan v3 — Wave 3 complete; Wave 4 P0s live)
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
| `convex/profile` | ✅ Done | `get`, `save`, `energy`, `setBudgetControls` — engine computes safetyMode server-side | W1 |
| `convex/foods` | ✅ Done | Reconciled seed, full-text BN/EN search, get/count/upsert — 318 rows live | W1–2 |
| `convex/privacy` | ✅ Done | `recordConsent`, `deleteMyData`, `auditTrail` | W1 |
| `convex/ai` | ✅ Live | `chat` (+RAG `context`, `[n]` citations), `parseMeal` (candidate pick), `rewriteQuery` | W2/5 |
| `convex/mealLogs` | ✅ Core live | List/create/update/remove/copy/day summary; profile-key checks | W2 |
| `convex/budget` | ✅ Live | `get` (7-day budget, overshoot, spread plan), `whatIf` simulator — engine-backed, computed on read | W3 |
| `convex/activity` | ✅ Live | `create` (preset/manual/steps, MET + net kcal), `remove`, `listWeek` (gauge totals) | W4 |
| `convex/rag` | ✅ Live | `rag.search` (action: vector + keyword merge), `rag.keywordSearch` | W5 |
| `convex/weights` | ✅ Live | `add` (upsert per date), `remove`, `trend` (weigh-ins + adaptive TDEE) | W3 |
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
| `RAG_INGEST_TOKEN` | Convex env + `.env.local` | ✅ for ingestion | Guards `rag.push*` / `rag.clearChunks`; **not** needed for search |
| `GROQ_EMBED_MODEL` | — | ❌ removed | Groq has no embeddings endpoint; vectors come from local `multilingual-e5-small` |

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

`measure` · `mealLogs` · `profiles` (+ safetyScreen, safetyMode, plate/rice calibration, budgetControls) · `activityLogs` (+ manual steps) · `budgetState` · `auditLogs` · **RAG/data corpus** (see below).

### RAG + data corpus tables (Wave 5 foundation — ✅ live)

| Table | Rows (dev) | Purpose |
|-------|-----------:|---------|
| `ragChunks` | 9,447 | Text chunks with `source`, `section`, `page`, `lang`, `keywords`, 384-dim `embedding`. Keyword + vector indexes. |
| `foodFacts` | 913 | Deduplicated FCTB 2013 + IFCT 2017 nutrients with provenance |
| `ragChunks` (alias doc) | 318 | Bangla/Banglish food aliases from the project seed |
| `recipes` | 5,938 | Structured recipes (name, cuisine, ingredients, method, URL) |
| `priceObservations` | 34,491 | WFP monthly market prices in BDT |
| `markets` | 171 | WFP market geography |
| `nutritionIndicators` | 23,746 | FAOSTAT food balance, food security and affordability |
| `datasetSources` | 16 | Dataset inventory with record + chunk counts and ingestion time |

**Indexes:** `ragChunks` has `by_doc`, `by_source_tag`, `search_text` (full-text) and `by_embedding` (384 dims, filters `sourceTag`/`lang`). Each structured table has a natural-key index; foods and recipes also have search indexes.

**Indexes:** by date, by user, by food — all hot paths. Vector search **only from actions**.

---

## 3. Convex Queries & Mutations (current — Wave 3 complete)

### `profile` (Wave 1 — ✅ live)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `profile.get` | query | `key?` | Profile row or null | Key defaults to `"default"` |
| `profile.save` | mutation | demographics + screening + consent | `{ id, safetyMode, asianBmiBand }` | Engine computes `safetyMode` server-side |
| `profile.energy` | query | `key?` | `{ bmrKcal, tdeeKcal, floorKcal, allowsDeficit, ... }` | Deterministic; no LLM |
| `profile.setBudgetControls` | mutation | `windowDays` (3–7), `intakeShare` (0.3–0.9) | null | FR-E-04: persisted on profile; `budget.get`/`whatIf` pass them to `rebalance()` |

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
| `mealLogs.daySummary` | query | `key?`, date | Meal count, kcal range, totals by slot, macros (protein/carb/fat/fibre), `ricePortionLabel`, plate-group kcal (seed index ranges) |

### `budget` / plan (Wave 3 — 🔄 `budget.get` live, Nov 3)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `budget.get` | query | `today` (YYYY-MM-DD) | Live weekly aggregation from mealLogs → TDEE/gentle-change target → `rebalance()` plan; activity logs credited against excess (FR-REBAL-08); returns overshoot, safety mode, 7-day series, plan days, profile name. Replaces the planned `budget.state` + `budget.plan` split (plan is computed on read, no budgetState writes) |
| `budget.whatIf` | query | `today`, `extraKcal` (0–10,000) | FR-E-08: same view as `budget.get` with simulated extra intake today (shared `computeBudget`); live on `/plan` stepper |

### `weights` (Wave 3 — ✅ live, Nov 3)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `weights.add` | mutation | `key?`, date, weightKg (20–300) | Upsert per profile+date; feeds FR-ATDEE-* |
| `weights.remove` | mutation | `key?`, id | Key ownership check (same pattern as `mealLogs.remove`) |
| `weights.trend` | query | `key?`, `today` | Last ≤14 days of weigh-ins (ascending) + `adaptiveTdee()` blend: estimate, confidence, status (formula/improving/settled), more-weigh-ins count, noise note; avg intake over the window. No profile → null |

### `activity` (Wave 4 — ✅ P0 live, Nov 3)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `activity.create` | mutation | `key?`, date, type, minutes, source (preset/manual/steps) | MET from `mets.ts`; net kcal ±15% via `netKcalRange` (FR-D-03); steps source: raw count → `stepsToMinutes` (~100/min), validated 1–100,000 before conversion |
| `activity.remove` | mutation | `key?`, id | Key ownership check |
| `activity.listWeek` | query | `key?`, `today` | Mon–Sun week: weekMinutes, net kcal totals, activeDays, entries with ids (feeds `/activity` gauge + chips) |

### `rag` (Wave 5 foundation — ✅ live)

| Function | Type | Args | Notes |
|----------|------|------|-------|
| `rag.search` | **action** | `query`, `queryEmbedding?`, `sourceTag?`, `lang?`, `limit?` | Hybrid: `ctx.vectorSearch` (when a 384-dim query vector is supplied) merged with keyword results. Returns text + citation metadata + score |
| `rag.keywordSearch` | query | `query`, `sourceTag?`, `lang?`, `limit?` | Full-text retrieval; always available, no embedding needed |
| `rag.sources` | query | — | Dataset inventory with record/chunk counts |
| `rag.pushChunks` | mutation | ingest token + ≤100 chunks | Point lookup via `by_doc_chunk` index; deletes extra rows sharing the key (self-healing); `mode:"insert"` for bulk loads |
| `rag.clearChunks` | mutation | ingest token, `docId?`, `limit?` | Batched re-ingest cleanup |
| `rag.pushRecipes` / `pushFoodFacts` / `pushPrices` / `pushMarkets` / `pushIndicators` / `pushSources` | mutation | ingest token + records | Upserts keyed by stable hash |

**Query embeddings:** `POST /api/embed` (Next.js, Node runtime) runs `Xenova/multilingual-e5-small` locally (quantized, 384 dims, Bangla-aware) and returns `{ embedding }`. Client helper: `src/lib/ai/rag.ts` → `embedQuery()`. This avoids a second paid API key because Groq hosts no embedding models.

---

## 4. AI Actions (`convex/ai.ts` — live)

All run in Convex actions (`"use node"`) via `groqChat()`. **Privacy hard rule:** never send age/weight/name/conditions to Groq — only food text, question, and safe categories (`mode=restricted`) set by code.

### 4.1 `ai.chat` (Wave 5 — RAG coach, ✅ live)

```ts
await chatAction({
  message: "ডায়াবেটিস থাকলে ভাত কত খাব?",
  safeContext: { mode: "normal", goal: "gentle-change", lang: "bn" },
  context: [{ text: "...", source: "National Dietary Guidelines...", section: "...", page: 90 }],
});
// → { response: "... [1] ..." } | { error }
```

Pipeline (✅ live): client `embedQuery` → `rag.search` (hybrid, ≥0.8, top 5) → optional `ai.rewriteQuery` when the query has Bangla script or the first pass is weak (second search, merged best-score-per-chunk) → Groq with numbered excerpts → answer with inline `[n]` markers → client parses markers into citation chips. No hits above threshold → answer flagged `lowConfidence`.

```ts
await rewriteAction({ query: "ডায়াবেটিস থাকলে ভাত কত খাব?" });
// → { rewritten: "type 2 diabetes rice portion size" } | { error }
// temperature 0, maxTokens 400 (gpt-oss reasons first — never below ~300)
```

### 4.2 `ai.parseMeal` (Wave 2 — ✅ wired; LLM chooses, code computes)

```ts
await parseMealAction({
  line: "dupure bhat, dal, alu bhorta, mach",
  candidates: [{ id, nameBn, nameEn, aliases }, ...],  // top-5 per phrase from client fuzzy search
});
// → { picks: [{ id, qty, unit }], notes? } | { error }
```

JSON mode with a maximum 25-item candidate pool. Returned IDs are checked against that pool; quantity is bounded to `0 < qty ≤ 20`; units are length-bounded. Code converts units → grams via `measures` and computes kcal. On Groq failure, `/log` uses the deterministic offline top candidate per clause. The 20-case local parser set and a live four-item Groq smoke pass.

### 4.3 `ai.analyzePhoto` (Wave 2 — ✅ live, gate passed as assisted)

```ts
await analyzePhoto({
  images: [...],            // ≤3 base64 JPEG payloads (no data: prefix), ≤400k chars each
  candidates: [...],        // all 318 seed foods: { id, nameBn, nameEn }
  platePreset?: "medium",   // reserved for profile calibration
});
// → { items: [{ foodId, portionClass: "small"|"medium"|"large", confidence }] } | { error }
```

- **Model:** `qwen/qwen3.8-27b` (override `GROQ_VISION_MODEL`), JSON mode, `temperature 0.1`, `max_tokens 700`.
- **Prompt economy:** candidates are sent as compact `id|nameEn` lines (Bangla script is token-expensive; client resolves display names). Groq qwen on_demand has a **7,000 input-tokens/min** ITPM limit — full 318-line list with Bangla exceeded it; English-only compact list fits (~5.6k incl. image). The action waits 30 s and retries once on 429/413.
- **Validation:** `foodId` must exist in the candidate set (model sometimes echoes `id|name`; the id part is taken), portionClass enum, confidence clamped 0–1, ≤10 items, deduped.
- **Client:** `/log/photo` compresses the capture (canvas → ≤768 px JPEG 0.7, `src/lib/ai/photo.ts`), calls the action, maps `portionClass` → grams via the food's measure ladder (`portionClassToGrams`), computes kcal **with ±15% range**, and shows a confirm screen with exclude toggles + S/M/L chips + slot picker → `mealLogs.create({ method: "photo" })`.
- **Gate (passed as assisted):** `bun scripts/test_vision.mjs --n 10` against FoodBD test labels + nutrition CSV — **49% mappable-GT recall, 55% precision, 123 kcal mean |error|** (5 images with CSV entries). Core staples (rice, dal, ruti-family, milk, egg-family, carrot, cucumber) hit reliably; misses concentrate on mixed/fried obscure vegetables and biriyani-vs-rice / fish-vs-chicken confusions. Verdict: assisted confirm-screen flow is the right ship mode; pre-tested demo photos available for stage.

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
