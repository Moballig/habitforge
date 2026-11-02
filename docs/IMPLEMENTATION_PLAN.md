# Deshi Health Companion — Full-Scope Build Plan (v3)

**Project:** Deshi Health Companion (working title) — Bangladesh-first calorie, diet & exercise-balancing app with RAG-grounded AI coach
**Buildathon:** Ostad Presents YUNet AIgnite Buildathon 2026
**Submission:** November 5, 2026 (keep main branch demoable at all times)
**Stack:** Next.js 16, Tailwind 4, Convex, Groq, Vercel
**Source of truth:** `docs/bangladeshi-calorie-companion-research.md` (section numbers below refer to it)

**Change from v2:** no time-driven cuts. Everything in the research checklist at P0 and P1 is in scope, plus most P2. The quality decisions from v2 stay: deterministic engine, LLM never produces numbers, safety gates, citations, assisted photo logging, Bangla templates for plan text.

**One rule replaces the cut ladder:** build in **waves**. Each wave ends with a working, demoable product and an exit gate. If the deadline arrives mid-wave, you still submit a coherent app.

---

## 0. Decisions that stay from v2

| Topic | Decision |
|---|---|
| Engine | Pure TypeScript in `lib/engine/`, shared by client and Convex, unit-tested, plus a property test (thousands of random overshoots never break the floor or caps) |
| Numbers | Calories, floors, exercise minutes come from code only. A validator blocks any number in an LLM reply that is not in a tool result or retrieved chunk |
| Plan text | Bangla and English **templates**, not LLM output |
| UI | Replace HabitForge screens. Routes: `/onboarding /home /log /plan /coach /activity /settings` plus new ones as waves add them |
| Parser | Fuzzy search gives top 5 candidates; LLM picks from them (JSON mode); code computes; tap-to-pick fallback |
| Photo | `qwen/qwen3.8-27b` on Groq (JSON mode, up to 3 images), relative portion class → grams via the user's plate preset → calories with range → confirm screen. Re-check the model name in Groq docs before coding |
| RAG | Convex vector index (actions only) + keyword/alias hybrid. Query rewritten to English before embedding. Chunks carry section and page. Refuse below a tuned threshold |
| Privacy | Never send age, weight, name or conditions to the LLM; pass safe categories like `mode=restricted` |
| Safety | `safetyMode()` returns normal, restricted or doctor-first; restricted modes disable deficits and the rebalance planner |
| Web substitutions | Phone step counters are not readable by a web app → manual steps entry. APK → installable web app (PWA) |

**Probes to run first (30 minutes each)** because they decide design details: Qwen vision on 10 plate photos; Bangla/Banglish queries on a **local multilingual embedding model** — Groq exposes no embeddings endpoint, so the originally named `nomic-embed-text-v1_5` is not callable there (verified: `/v1/embeddings` → 404); Chrome `bn-BD` speech recognition (Chrome 139+ only).

---

## 1. Parallel data tracks (run alongside every wave)

These block features if they start late. Assign them from day one.

| Track | What | Needed by |
|---|---|---|
| D1 | Download FCTB Excel from FAO; script it into `foods` rows | Wave 1 |
| D2 | Hand-verify the most common 150 foods first, then grow to **300 to 500** | Wave 1 to 3 |
| D3 | Build **plate-ready recipe rows** (cooked rice, dal, bhorta types, fish and egg curries, khichuri, biriyani, tehari, ruti, paratha, singara, fuchka, milk tea with sugar, pitha, mishti) from ingredient grams and oil. Tag `estimated-recipe` | Wave 1 to 2 |
| D4 | **Kitchen-scale session:** bati S/M/L, spoons, glasses, ladle, plate diameters → `measures` table | Wave 1 |
| D5 | **Weighed-plate capture:** photo + ingredient weights for 50 to 100 home-style plates | Evaluation, Wave 8 |
| D6 | **Bazar price walk:** 30 to 60 staples with price per kg and season note | Wave 5 to 6 |
| D7 | **Guideline corpus:** download the 2025 dietary guidelines PDF, chunk by heading, keep tables structured | Wave 5 |
| D8 | Street-food and restaurant calorie estimates with ranges | Wave 2 |
| D9 | Dataset licence check (FoodBD, DeshiFoodBD, BD-Food33, rice dataset) | Before any public claim |
| D10 | A nutritionist or dietitian review session for caps, floors, screen questions, referral wording, swaps | Wave 1 and Wave 8 |

---

## 2. Waves

Each item lists its research reference. Gates are acceptance tests, not dates.
**Status legend:** ✅ Done · 🔄 In progress · ⬜ Planned

### Wave 1: Foundation (engine, safety, profile, data) — ✅ DONE (Nov 2, 2026)

| Item | Ref |
|---|---|
| Delete habit routes; final route skeleton; i18n for Bangla/English; Bangla numerals | §6-A |
| Profile: age, sex, height, weight, activity, goal, pace | §6-A |
| **Asian BMI (23 / 27.5)**, waist circumference, waist-to-height ratio | §3, §6-A |
| Eating style (rice-heavy, roti-heavy, vegetarian, no-beef, halal-only, fasting habits), budget band in taka, household profile (who cooks, how many eat from the pot, meals out), daily routine (prayer times, commute) | §6-A P1 |
| Engine: BMR, TDEE, net MET energy, `safetyMode`, `rebalance`, tests, property test | §5 |
| Safety screening and restricted/doctor-first modes | §5.5 |
| Consent, delete-my-data, disclaimer, encrypted transport | §6-J |
| Food DB schema, seed from FCTB, source tags, ranges for uncertain nutrients, measures table | §4, §6-K |

**Gate:** six test profiles give the expected safety mode; property test passes; 150+ foods seeded with visible source tags; hand check of 40 minutes brisk walking at 4.3 MET for 70 kg ≈ 154 kcal net.
**Gate result (Nov 2):** ✅ 30/30 tests (27 engine + 3 food) · 318 foods seeded · 154 kcal verified · 6 profiles pass · lint 0 errors · build green

### Wave 2: Logging — 🔄 IN PROGRESS

| Item | Ref |
|---|---|
| Text logging, Bangla/English/Banglish, household measures, plate fractions | §6-B P0 |
| Recents, favourites, same-as-yesterday, copy meal | §6-B P0 |
| Deshi DB grows toward 300 to 500; aliases and spellings | §6-B P0 |
| **Rice calibrator:** choose your plate and bowl, portions of cooked rice at 100/150/200/300 g with reference photos, save "my usual rice" | §6-B P1 |
| Rice type hints (miniket, nazirshail, parboiled, atop, brown, polao) with local glycaemic-index hints | §6-B P1 |
| **Home-cooked recipe builder** (ingredients, oil, servings, cooking method) | §6-B P1 |
| **Shared-pot mode** (fraction of pot, spoons from the pot) | §6-B P1 |
| Street food presets; restaurant and delivery items with ranges | §6-B P1 |
| **Photo logging, assisted** (section 0) with user-calibrated plates | §7.4 |
| Bangla voice logging (Chrome only, if `bn-BD` passes the probe) | §6-B P1 |
| Barcode scan for local packaged brands (start with a small crowd-built list) | §6-B P1 |

**Gate:** 20 saved Banglish lines parse correctly; five tested plate photos reach correct items after at most one edit; a shared-pot dal entry computes sensible grams.

**Progress (Nov 2):** ✅ 318-row reconciled seed · indexed BN/EN server search + bundled offline alias search · live meal CRUD/day-summary · `/log` saves through Convex · 20 deterministic Bangla/Banglish parser cases pass + live Groq candidate smoke passes · shared-pot 1/5 dal math/UI passes. ⬜ Assisted-photo gate remains; rice/recipe/voice/barcode scope remains.

### Wave 3: Tracking and the balance engine — ⬜

| Item | Ref |
|---|---|
| Daily and weekly calories, protein, carbohydrate, fat, fibre | §6-C |
| **Plate-balance view** from national healthy-plate guidance | §6-C |
| Micronutrients (iron, vitamin A, calcium, zinc, vitamin D, B12) shown as **ranges** | §6-C |
| Sodium and oil awareness; sugar as spoons; glycaemic-load estimate with swap suggestions; water with heat-adjusted reminders; dietary-diversity score | §6-C |
| **7-day budget, overshoot detection, spread plan** with user controls (window, 60/40 split, preferred exercise, days off), caps, floor, shame-free copy, Bangla arithmetic with ±range | §5.2, §6-E |
| Planned-feast mode (Eid, weddings) | §6-E P1 |
| **What-if simulator** and **reverse mode** | §6-E P1 |
| **Adaptive TDEE** with honest "estimate improving" states; demo with simulated weigh-ins, labelled | §5.3 |
| Weight-trend chart with noise notes (Eid, illness, travel, cycle) | §6-E P2 |
| Home screen: calories, rice portion, plate balance, one next action | §6-H |

**Gate:** Friday-biriyani scenario yields a plan matching a hand calculation; zero violations in 5,000 simulated overshoots; feast mode never pushes a day below the floor.

### Wave 4: Activity — ⬜

| Item | Ref |
|---|---|
| MET-based logging (walking, jogging, cycling, cricket, football, badminton, swimming, yoga, home bodyweight, chores) with net-calorie logic | §6-D P0 |
| Manual steps and activity entry (web substitute for step import) | §6-D |
| No-equipment and small-space plans (rooftop, balcony, room, low-noise) | §6-D P1 |
| **Context-aware suggestions:** heat, rain, air quality, load-shedding, daylight. Needs a weather and AQI source; pick and verify an API before building | §6-D P1 |
| Prayer-time and Ramadan-aware slots. Needs a prayer-time library or API; pick and verify | §6-D P1 |
| Women-friendly privacy mode (home-only plans, no public leaderboard) | §6-D P1 |
| Beginner progression aligned with the national physical-activity pyramid | §6-D P1 |
| Gym-light strength plans; exercise safety warnings | §6-D P2 |

**Gate:** poor air quality or extreme heat switches suggestions to indoor options; extra-activity minutes in the plan match the MET formula.

### Wave 5: AI coach (RAG) — 🔄 data foundation live

**Done (Nov 3):** 9,447-chunk corpus from `/data` — guidelines, FCTB/IFCT books, 913 food facts, 318 Bangla/Banglish aliases, 5,938 recipes, 232 indigenous-table chunks, 76 research chunks, 73 price summaries, 157 FAOSTAT summaries. Convex `ragChunks` has keyword + 384-dim vector indexes; `rag.search` merges both; `POST /api/embed` runs multilingual-e5-small locally. Structured mirrors: `foodFacts`, `recipes`, `priceObservations`, `markets`, `nutritionIndicators`, `datasetSources`. Next: coach wiring, Groq query rewrite, citation UI, 20-question gate.

| Item | Ref |
|---|---|
| Chat in Bangla, English, Banglish | §6-F P0 |
| Grounded answers with citation chips; hybrid retrieval; refusal below threshold | §7.2 |
| Tool-calling for all numbers; validator | §7.5 |
| Refusal and redirect rules (medical, drug, extreme diets) | §6-F P0 |
| **Meal suggestions** that fit remaining budget, cost band and season | §6-F P1 |
| **Smart swaps** with local alternatives | §6-F P1 |
| **Cheap-protein finder** (protein per taka from your bazar prices) | §6-F P1 |
| "Why" line on every suggestion; weekly review without scolding | §6-F P1 |
| Proactive nudges timed to routine; Bangla voice reply | §6-F P2 |

**Gate:** 20 guideline questions return the right section; unsafe prompts are refused with a safer alternative; every number in replies traces to a tool or chunk.

### Wave 6: Personalisation (the "why us" layer) — ⬜

| Item | Ref |
|---|---|
| Regional variants (home region tunes defaults) | §6-G P1 |
| Plate and bowl personalisation (photograph your own plate once) | §6-G P1 |
| **Ramadan mode:** iftar/sehri plans, hydration, light-exercise timing, no deficit pressure unless opted in | §6-G P1 |
| **Taka-aware weekly planner** with shopping list | §6-G P1 |
| **Family and caregiver mode:** one menu that works for the user and others (children, elders, a family member with diabetes) | §6-G P1 |
| Seasonal and festival calendar (pitha season, Eid foods, Pohela Boishakh, community festivals), respectful and non-judgemental | §6-G P1 |
| **Condition-aware modes** (diabetes-friendly, hypertension-friendly plates from the national guidelines' disease sections), only behind safety gates and disclaimers | §6-G P1 |
| Community and office challenges (team goals, not weight competition); dietitian PDF handoff; lab-report OCR; moderated community recipes | §6-G P2 |

**Gate:** Ramadan mode never shows a deficit prompt by default; family mode produces one menu with per-person portions; condition modes show a doctor note.

### Wave 7: Offline, privacy, admin, UX polish — ⬜

| Item | Ref |
|---|---|
| Installable web app: service worker, cached food snapshot, IndexedDB logs, engine on the client; queued sync, last-write-wins per entry | §6-I |
| Data-saver mode (compress images, defer uploads) | §6-I P1 |
| Low-end phone testing; large-text, dark mode, low-literacy mode with icons | §6-H |
| Local-first storage option; audit log of AI suggestions (what was retrieved and why) | §6-J P1 |
| Admin panel (add/edit foods, recipes, prices), "report wrong calories" review queue, source tags everywhere | §6-K |
| Forgiving streaks, home-screen widget or quick-log shortcut where the platform allows; light badges for balanced plates | §6-H |
| Bias check across age, sex and body type | §6-J P2 |
| Analytics dashboard (anonymised: most-logged foods, missing foods) | §6-K P2 |

**Gate:** airplane mode: add a log, view the plan, reload, data persists; delete-my-data clears Convex and local cache.

### Wave 8: Proof, red-team, packaging — ⬜

| Item | Size (full) |
|---|---|
| Calorie error on weighed plates (text and photo) | **50 to 100 plates**; report MAPE and per-plate table |
| Parsing accuracy | **200** Bangla, English and Banglish lines |
| RAG quality | **50** guideline questions: correct source and faithful answer |
| Red-team | **30 prompts** (crash diets, fasting for fast loss, insulin, "burn off a binge", eating-disorder language); fix at least two failures and show before/after |
| Rebalancing | 5,000 simulated overshoots, zero violations |
| Usability | 5 to 10 real users, average seconds per logged meal |
| Nutritionist review of caps, floors, screen questions, swaps | Record the outcome; claim "reviewed by" only if it happened |
| Deploy, real-phone test on mobile data, README, deck, recorded demo | — |

Report the sample size beside every number and state limits found (mixed dishes, street food, portion error).

---

## 3. Order inside the build

1. Probes, then Wave 1.
2. Wave 2 and Wave 3 in parallel if you are more than one person (logging vs engine UI).
3. Wave 4 and Wave 5 in parallel.
4. Wave 6 once data tracks D6 and D7 are done.
5. Wave 7 starts early for the service-worker skeleton (retrofitting offline late is painful), finishes late.
6. Wave 8 evaluation runs after Wave 5; the red-team after Wave 5 and again after Wave 6.

**If you work solo,** do the waves in numeric order. The earlier waves already make a complete demo: onboarding with safety, deshi logging, the rebalancing plan, activity, and the cited coach.

---

## 2a. Wave status summary

| Wave | Title | Gate | Status |
|------|-------|------|--------|
| 1 | Foundation (engine, safety, profile, data) | 6 safety profiles · property test · 150+ foods · 154 kcal | ✅ **Done** (Nov 2, 2026) |
| 2 | Logging | 20 Banglish lines · 5 plate photos · shared-pot dal | 🔄 **In progress** — parser/shared-pot pass; photo pending |
| 3 | Tracking + balance engine | Friday-biriyani hand calc · 5,000 sims · feast floor | ⬜ |
| 4 | Activity | AQI/heat → indoor · MET minutes match formula | ⬜ |
| 5 | AI coach (RAG) | 20 guideline Qs · unsafe refused · numbers traceable | 🔄 Data + hybrid retrieval live; coach wiring pending |
| 6 | Personalisation | Ramadan no deficit · family menu · condition modes | ⬜ |
| 7 | Offline/privacy/admin | Airplane mode persists · delete-my-data clears | ⬜ |
| 8 | Proof, red-team, packaging | Report sample sizes · state limits | ⬜ |

**Related docs:** `docs/DIAGRAMS.md` (DFD L0–L2 + sequence diagrams) · `docs/SRS.md` §9 (SRS traceability table) · `docs/CONTEXT.md` (living tracker)

---

## 4. Demo (full-scope version)

Same eight beats as v2, with extras you can add if the waves are done:

| # | Beat | Fallback if it breaks |
|---|------|------------------------|
| 1 | Problem: global apps don't know bhorta, shorshe ilish or the family pot, and they punish an over-day | — |
| 2 | Onboarding in Bangla, Asian BMI, safety screen (show one doctor-first profile briefly) | Pre-filled profile |
| 3 | Photo-log a rice plate, tap-correct, see range and source tags | Pre-tested photo; or text log |
| 4 | Banglish text log | Tap-to-pick list |
| 5 | **Overshoot → gentle plan**, toggle the 60/40 split live | Works offline; no external dependency |
| 6 | Coach with citation: "diabetes thakle bhat koto khabo?" | Cached answer for the exact demo question |
| 7 | Airplane mode: log and plan still work | Screen recording |
| 8 | Impact and roadmap | — |

Extras if the waves are done: Ramadan mode switch (iftar plan, no deficit pressure) · Taka planner and cheap-protein finder ("protein under 100 taka/day") · Family mode with one menu and different portions · Condition-aware plate with doctor note · Evaluation table, red-team before/after, property-test result.

Keep fallbacks: cached coach answer for the demo question, pre-tested photos, recorded video, seeded demo user with one week of data.

---

## 5. Risks that remain even with unlimited time

| Risk | Mitigation |
|---|---|
| Food tables raw vs cooked; tables disagree | Recipe rows, source tags, ranges |
| LLM Bangla quality | Templates for safety and plan text; test chat quality with native speakers |
| Embedding quality for Bangla/Banglish | Query rewrite to English, keyword fallback, 50-question retrieval test |
| Photo accuracy on mixed dishes | Assisted mode, confidence, edit screen, report honest MAPE |
| Safety harm | Gates, caps, no 100% compensation, no punishment language, reviewed referral copy |
| Scope sprawl | Wave gates; never start a wave with a failing gate behind it |
| Third-party APIs (weather, AQI, prayer times) | Verify availability and terms before building; cache; graceful fallback |
| Dataset licences | Check before any public claim (track D9) |
| Over-claiming | Only measured, sized numbers |

---

## 6. Confirm before you start

1. Real submission deadline and any rule on pre-existing code, AI-use disclosure, dataset and API use.
2. Team size (the waves split cleanly into: engine/plan, data/logging, coach/RAG/photo).
3. A named nutritionist or dietitian for review (track D10).

**Sources for the technical checks:** Convex vector search (docs.convex.dev/search/vector-search), Groq vision and embeddings docs (console.groq.com/docs/vision; apis.io Groq embeddings summary), speech recognition support (web-platform-dx.github.io/web-features-explorer/features/speech-recognition). Re-check these on build day because model names and limits change.
