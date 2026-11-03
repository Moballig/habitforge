# Deferred / skipped — review list

Everything consciously not built (or only partially built) through Nov 3, 2026 sessions. Nothing here is forgotten work — it was cut for scope, blocked on data/source, or left as a known simplification.

## Known doc ↔ reality gaps (noticed, not fixed)

- **`budgetState` table** exists with `by_profile_and_week` index but is never written (plan is computed on read — intentional, only privacy.ts deletes it).

## Wave 3 (tracking + balance) — remaining

- **Preferred exercise types + days-off controls** (FR-REBAL-11 remainder): window length and 60/40 split are live (`profile.setBudgetControls` → `/plan`), but `RebalanceControls` has no fields for exercise preference or days the user cannot train — engine work first.
- **Micronutrients as ranges** (FR-C-03, P1): iron/vit A/calcium/zinc/D/B12 — needs micro values added to the 318-row seed (data chore, FCTB source).
- **Sodium/oil awareness** (FR-C-04), **sugar as spoons** (FR-C-05), **glycaemic-load + swap suggestions**, **dietary-diversity score** — same seed-data blocker.
- **After-event recovery** half of planned-feast mode: `feastPreBank()` + reverse UI cover *pre-bank* only; no post-feast catch-up plan.
- **Weight-trend noise smoothing** (FR-E-10 wording): chart shows raw weigh-in points; no smoothing curve, no per-entry Eid/illness/cycle note picker (static noise copy instead — FR-ATDEE-04 is text-only).

## Wave 4 (activity) — remaining

- **FR-D-05 remainder**: rain, load-shedding and daylight context (no sources picked yet). AQI + heat are live (Open-Meteo, `convex/weather.ts`).
- **Region → coordinates**: `weather.ts` hardcodes Dhaka coords — `homeRegion` is never collected in onboarding, so there is nothing to map yet.
- **Local AQI scale**: thresholds use US AQI (≥151) per EPA; swap for a Bangla/DAQMS scale when localizing (noted in `src/lib/engine/context.ts`.
- **No-equipment / small-space plans** (FR-D-04, P1) — rooftop/balcony/room/low-noise options.
- **Prayer-time & Ramadan slots** (FR-D-06, P1) — needs prayer-time library/API.
- **Women-friendly privacy mode** (FR-D-07, P1) — home-only plans, no leaderboard.
- **Beginner progression 10→30 min** (FR-D-08, P1) + activity-pyramid guidance.
- **Gym-light strength plans** (FR-D-09, P2), **exercise safety warnings** (FR-D-10, P2).
- **Water tracking**: tile/chip removed from home + activity — no `waterLogs` table or any data source ever built.
- **Static leftovers on `/activity`**: "Next: Evening walk" stat and Active-days sparkline are still decorative (active-days number itself is live).
- **Mock fixtures still rendered**: `RightPanel` shows `TODAY_MEALS`, `/coach` opens with a `COACH_SEED` demo exchange, `/settings` uses `DEMO_PROFILE`, `/dev/components` gallery — cosmetic only; all live data paths use Convex.
- **`/log` chips decorative**: Recents / Favourites / Same yesterday / Copy meal render but have no handlers (`listRecent`/`copyMeal` APIs are ready).

## Wave 5+ (gates met; P1s pending)

- Taka-aware weekly planner + shopping list (FR-G-05), dietitian PDF export (FR-G-10).
- Wave 6 carried beyond the gate: seasonal/festival calendar (FR-G-07), `homeRegion` collection in onboarding → weather coordinates (FR-G-02, see W4 note above), plate/bowl photo calibration UI (FR-G-03), Ramadan light-exercise timing (FR-G-04 remainder).
- Offline sync queue + data-saver (FR-I-04/05); service worker shipped (FR-I-01 basic offline shell, Nov 3).
- Admin CRUD, prices/bazar module, analytics dashboard (FR-K-*).

## Quality / test gaps

- **Convex functions have no `convex-test` suite** — `budget`, `weights`, `activity`, `daySummary` verified only by live `convex run` checks during the session (values hand-checked, test rows removed after).
- **No component/page tests** for `/home`, `/plan`, `/insights`, `/activity`, `/coach` (bun suite covers engine + foods/parser/portion/groups + AI numbers/RAG intent + family portions; 98 passing).
- **No visual/browser check** of any page — verification is HTTP 200 + API-level only.
- **Plate-group simplification**: mixed dishes and the "Dairy & drinks" section count as `other` in `daySummary.plate` (deliberate; revisit if plate balance gets scrutiny).
- **`budget.whatIf` extraKcal capped at 10,000** — a single day can't exceed the weekly budget via the simulator alone when the week is empty (correct behaviour, noted so it isn't mistaken for a bug).

## Tooling (outside the app)

- **opencode restart pending** for the globally installed `ponytail` plugin and `ui-ux-pro-max` skill (registered in `~/.config/opencode/`, not yet active in this session).
- **6 sibling design skills not installed** (repo has them): ui-styling, design-system, banner-design, slides, brand, design.
