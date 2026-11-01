# Deshi Health Companion — Software Requirements Specification (SRS)

**Version:** 2.0 (rewritten from `bangladeshi-calorie-companion-research.md`)
**Date:** November 2, 2026
**Working title:** Deshi Health Companion *(rename freely — research doc title)*
**Buildathon:** Ostad Presents YUNet AIgnite Buildathon 2026
**Source of truth:** `docs/bangladeshi-calorie-companion-research.md` (all sections referenced below)
**Repo:** `habitforge` (existing Next.js 16 + Convex + Groq platform is the starting base)

> **Rule for this document:** every requirement traces to a section of the research doc.
> No features are added beyond it. Priority tags map the research's checklist: **[P0]** = Must work in the live demo, **[P1]** = strong differentiator, **[P2]** = stretch/roadmap (Research §6).

---

## 1. Introduction

### 1.1 Purpose
Specifies the requirements for Deshi Health Companion: a Bangladesh-first calorie, diet and exercise-balancing app with an AI coach grounded by RAG on local food and health data (Research, opening). Authoritative reference for design, development, testing and evaluation through the buildathon (Nov 1–5, 2026).

**Build order:** `docs/IMPLEMENTATION_PLAN.md` (Plan v3 — waves). All P0/P1 research items are in scope, plus most P2; each wave has an exit gate.

### 1.1a Scope deviations (web platform — Plan v3 §0)

| Research item | Deviation | Reason |
|---|---|---|
| Steps import from phone health APIs (FR-D-02, P0) | **Manual steps entry** | Web app cannot read phone step counters |
| APK, low-RAM, on-device photo model (FR-I-*) | **Installable web app (PWA)**: service worker + local cache; photo stays **online-only** (Groq Qwen vision) | Stack is Next.js/Vercel |
| Voice logging (FR-B-01/06) | **Chrome-only** (SpeechRecognition 139+); `bn-BD` probe-gated; optional | Browser support limits |
| Conflict-safe sync | **Last-write-wins per log entry** | Hackathon scope |

### 1.2 Scope
B2C web/mobile-first application for Bangladeshi users: deshi food logging (text, Banglish, photo, voice), household-measure portioning, calorie/macro/nutrient tracking with Asian-adjusted health context, exercise/activity energy, and the headline **"eat more, then rebalance over the next few days"** engine — plus a citation-grounded AI coach (Research §1–§7).

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|-----------|
| **BMR** | Basal Metabolic Rate — Mifflin-St Jeor (Research §5.1) |
| **TDEE** | Total Daily Energy Expenditure — BMR × activity factor, later replaced by adaptive estimate (§5.1, §5.3) |
| **Adaptive TDEE** | Weekly re-estimate of real expenditure from weight trend vs logged intake (§5.3) |
| **MET** | Metabolic Equivalent of Task — `kcal = MET × kg × hours`; net = `(MET − 1) × kg × hours` (§5.1) |
| **Overshoot** | Intake above today's target beyond a small tolerance (default >100 kcal) (§5.2) |
| **Rebalance** | Spreading recovery of an overshoot over 3–7 days via intake trims + light activity (§5.2) |
| **Safety floor** | Personal daily minimum (default: user's BMR, not 1,200) — never pushed below (§5.2, §5.5) |
| **RAG** | Retrieval-augmented generation — answers grounded in retrieved sources with citations (§7) |
| **Household measures** | bati, serving spoon, glass, piece, ladle, plate fraction, hand portion (§6-B) |
| **Plate fraction** | Quarter/half/full plate with a reference plate size (§6-B) |
| **Asian-adjusted BMI** | BMI action points 23 (overweight) / 27.5 (obese) per WHO 2004 for Asians (§3) |
| **Shared-pot mode** | Logging a fraction of a family pot without knowing the recipe (§2 G4, §6-B) |
| **Rice calibrator** | User picks usual plate/bowl; photos of rice at 100/150/200/300 g cooked saved as "my usual rice portion" (§6-B) |
| **FCTB** | Food Composition Table for Bangladesh (2013) — primary nutrition source (§4.1) |
| **Planned feast** | Pre-bank before a social occasion + after-event recovery plan (§5.2 rule 8, §6-E) |

### 1.4 References
- `docs/bangladeshi-calorie-companion-research.md` — **primary source** (§1–§11)
- National Dietary Guidelines for Bangladesh (Aug 2025) — RAG corpus core (§4.3, §7.2)
- Food Composition Table for Bangladesh (FCTB 2013) + FCT 2012 ethnic foods (§4.1)
- FoodBD, BD-Food33, DeshiFoodBD, Aruzz22.5K rice image datasets (§4.2)
- WHO 2004 Asian BMI consultation; Compendium of Physical Activities (MET) (§4.3)
- Research §11 for the full source list with evidence labels

---

## 2. Product Context

### 2.1 Market position (Research §1 — summary)
Global apps (MyFitnessPal, Cronometer, MacroFactor, photo-first apps) and Indian HealthifyMe do not serve Bangladeshi home cooking, Bangla language, household measures, shared-pot eating, or taka budgets. Bangladesh has only small/basic local calculators; no mature Bangla-first tracker with deshi food depth, photo recognition and AI coaching was found by search (§1.3, with its stated caveat).

### 2.2 Gaps owned by this product (Research §2)

| # | Gap | Requirement consequence |
|---|-----|------------------------|
| G1 | No Bangla/Banglish logging, voice, coaching | Bangla + Banglish + Bangla voice everywhere |
| G2 | Global DBs flatten "curry"/"dal" | Deshi food DB with oil/cut/region depth |
| G3 | Grams/cups unnatural | Household measures + plate fractions |
| G4 | Shared-pot cooking unknown | Shared-pot mode |
| G5 | Rice-centred plates | Rice calibrator + rice-specific accuracy |
| G6 | Local risk profile (diabetes, body fat at lower BMI) | Asian BMI 23/27.5 + waist measures |
| G7 | Ramadan, festivals, seasons, heat, pollution, prayer times | Context-aware modes and suggestions |
| G8 | Taka budget reality | Taka-aware planner, cheap-protein finder |
| G9 | Data cost / uneven coverage | Offline-first core |
| G10 | No gentle recovery across days | **Rebalance engine (headline)** |
| G11 | Harm risk for vulnerable users | Safety gates, responsible AI |

### 2.3 Health context driving requirements (Research §3)
- Diabetes 13.2% of adults 20–79 (IDF 2024 as reported), second-highest in South Asia (§3).
- Asian BMI action points **23 / 27.5**; South Asian dysglycaemia at lower BMI → show Asian-adjusted BMI, waist circumference, treat BMI 23+ as risk discussion point (§3).
- South Asia white-rice intake ~630 g/day; carbs ~80% of calories in many South Asian diets; local GI data exists for six rice varieties sold in BD markets (§3) → rice calibrator, GI hints, plate-method nudges are highest-impact.
- *National Dietary Guidelines for Bangladesh* (Aug 2025): food pyramid, healthy plate, activity pyramid, standardised weights/measures, food exchange lists, disease-specific guidance → **best RAG corpus, official** (§3, §4.3).
- Connectivity: ~93.4M people offline end-2025; data cost is the named barrier → offline-first, small size, on-device core flow (§3).

---

## 3. Core Engine Requirements (FR-ENGINE — Research §5)

### 3.1 Formulas (FR-ENG — deterministic, unit-tested, **no LLM** per §7.1)

| ID | Requirement | Ref |
|----|------------|-----|
| FR-ENG-01 | System SHALL compute BMR via Mifflin-St Jeor: men `10×kg + 6.25×cm − 5×age + 5`; women `… − 161` | §5.1 |
| FR-ENG-02 | System SHALL compute TDEE = BMR × activity factor, replaced over time by the adaptive estimate | §5.1, §5.3 |
| FR-ENG-03 | System SHALL compute exercise energy `kcal = MET × kg × hours`, using **net** `(MET − 1) × kg × hours` for planning extra burn | §5.1 |
| FR-ENG-04 | System SHALL apply ~7,700 kcal per kg of body-weight change for budget math | §5.1 |
| FR-ENG-05 | System SHALL keep suggested rate of loss to ~0.5–1 kg/week (or 0.5–1% body weight/week) | §5.1 |
| FR-ENG-06 | System SHALL surface protein guidance range ~1.6–2.2 g/kg/day during a deficit (as information, not a prescription) | §5.1 |
| FR-ENG-07 | System SHALL display exercise estimates with ±15% uncertainty note | §5.1, §5.4 |

### 3.2 Weekly budget with banking & rebalancing (FR-REBAL — §5.2)

| ID | Requirement | Ref |
|----|------------|-----|
| FR-REBAL-01 | System SHALL maintain a **7-day rolling energy budget** instead of only a hard daily limit | §5.2 |
| FR-REBAL-02 | System SHALL detect overshoot when `intake − target > tolerance` (default 100 kcal) | §5.2 rule 1 |
| FR-REBAL-03 | System SHALL produce a friendly recovery plan over 3–7 days (default 4) | §5.2 rule 2 |
| FR-REBAL-04 | System SHALL split recovery between intake trims and light extra activity (default 60/40, user-selectable) | §5.2 rule 3 |
| FR-REBAL-05 | System SHALL **never compensate 100%** — cover ~50–70% of an overshoot; weekly weight trend handles the rest | §5.2 rule 4 |
| FR-REBAL-06 | System SHALL cap extra activity per day (default net 200 kcal/day for beginners; more only if user already trains) | §5.2 rule 5 |
| FR-REBAL-07 | System SHALL never push any day below the personal floor (default = user's BMR, **not 1,200**) | §5.2 rule 6 |
| FR-REBAL-08 | System SHALL forgive and re-spread silently when a planned activity is skipped — no red banners | §5.2 rule 7 |
| FR-REBAL-09 | System SHALL offer **planned feast** mode: small pre-bank before Eid/wedding/family dinner + after-event recovery | §5.2 rule 8, §6-E |
| FR-REBAL-10 | Plan output SHALL show the arithmetic in plain Bangla with uncertainty (e.g. "১৬ মিনিট দ্রুত হাঁটা ≈ ৬২ কিলোক্যালরি ±১৫%") | §5.4 |
| FR-REBAL-11 | User controls: window length, 60/40 split, preferred exercise types, days they cannot train | §6-E |

### 3.3 Adaptive TDEE (FR-ATDEE — §5.3)

| ID | Requirement | Ref |
|----|------------|-----|
| FR-ATDEE-01 | System SHALL start from the formula estimate | §5.3 |
| FR-ATDEE-02 | Each week system SHALL compare smoothed weight-trend against average logged intake and back out `TDEE ≈ average intake − (weight change × 7,700 ÷ days)` | §5.3 |
| FR-ATDEE-03 | System SHALL blend slowly (2–3 weeks of data to settle) and show honesty states like "estimate improving, needs 5 more weigh-ins" | §5.3 |
| FR-ATDEE-04 | System SHALL warn that Eid weeks, sodium and menstrual cycle can shift scale weight | §5.3 |

### 3.4 Safety gates (FR-SAFETY — §5.5, **before any plan is shown**)

| ID | Requirement | Ref |
|----|------------|-----|
| FR-SAFETY-01 | Onboarding SHALL screen: age <18, pregnancy/breastfeeding, BMI <18.5, diabetes on insulin/sulfonylureas, heart/kidney disease, eating-disorder history | §5.5 |
| FR-SAFETY-02 | High-risk users get deficits and exercise compensation **turned off** and a "talk to a doctor or dietitian" referral (BIRDEM-style text) | §5.5 |
| FR-SAFETY-03 | Eating-disorder guardrails: no streak-shaming, no "burn off that meal" language, no compensation after binge-like patterns, soft check-ins on very low intake / very high exercise | §5.5 |
| FR-SAFETY-04 | Diabetes mode: no fasting or intense-exercise adjustments that risk hypoglycaemia without medical review | §5.5 |
| FR-SAFETY-05 | Visible "not a medical device" statement; no diagnosis | §5.5 |
| FR-SAFETY-06 | **LLM never sets numbers** — calories, floors and exercise minutes come from deterministic code; LLM only explains and chats | §5.5, §7.1 |
| FR-SAFETY-07 | Red-flag symptoms (chest pain, fainting, severe dizziness) trigger stop-and-seek-care message | §5.5 |

---

## 4. Functional Requirements by Checklist Area (Research §6)

### A. Onboarding & profile

| ID | Requirement | P |
|----|------------|---|
| FR-A-01 | Bangla and English UI toggle; Bangla numerals option | P0 |
| FR-A-02 | Profile: age, sex, height, weight, activity level, goal (lose/maintain/gain/build muscle), pace | P0 |
| FR-A-03 | Asian-adjusted BMI (23/27.5) with simple explanation + waist circumference + waist-to-height ratio | P0 |
| FR-A-04 | Safety screening (§3.4) with branching to restricted doctor-first mode | P0 |
| FR-A-05 | Eating style: rice-heavy, roti-heavy, vegetarian, no-beef, halal-only, fasting habits | P1 |
| FR-A-06 | Budget band in taka per day for food | P1 |
| FR-A-07 | Household profile: who cooks, how many eat from the pot, meals eaten out per week | P1 |
| FR-A-08 | Daily routine: work hours, prayer times, commute type (walk, rickshaw, bus, CNG, bike) | P1 |
| FR-A-09 | Optional family accounts with consent (parent summary, caregiver mode for elders) | P2 |

### B. Food logging (daily habit)

| ID | Requirement | P |
|----|------------|---|
| FR-B-01 | Bangla and Banglish text logging: "dupure bhat, dal, alu bhorta, mach" → structured items + portions | P0 |
| FR-B-02 | Photo logging with segmentation (FoodBD-style): item list, confidence, one-tap fix of items/portions | P0 |
| FR-B-03 | Deshi food database: Bangla name, English name, aliases, common spellings, region tags | P0 |
| FR-B-04 | Household measures: bati (S/M/L), serving spoon, tea spoon, glass, cup, piece, ladle, hand portion, plate fraction (¼/½/full) with reference plate size | P0 |
| FR-B-05 | Recents, favourites, "same as yesterday", copy meal | P0 |
| FR-B-06 | Bangla voice logging (speech-to-text → same parser) — **Chrome-only, `bn-BD` probe-gated** (§1.1a) | P1 |
| FR-B-07 | Rice calibrator: usual plate/bowl, photos at 100/150/200/300 g cooked, save "my usual rice portion" | P1 |
| FR-B-08 | Rice type hints (miniket, nazirshail, parboiled, atop, brown, polao) with glycaemic hints from local GI data | P1 |
| FR-B-09 | Home-cooked recipe builder: ingredients, oil, servings → per-serving values; store "Amma's dal"; cooking-method/oil-absorption options | P1 |
| FR-B-10 | Shared-pot mode: "about 1/5 of the pot" or "2 spoons from the family pot" | P1 |
| FR-B-11 | Street food/snack presets: fuchka, chotpoti, singara, samosa, jhalmuri, bhaja-puri, sweet tea, beguni, piyaju | P1 |
| FR-B-12 | Restaurant/delivery items (biriyani, tehari, kacchi, burger chains, sweet shops) with ranges | P1 |
| FR-B-13 | Barcode scan for packaged local brands (crowd-built database start) | P1 |
| FR-B-14 | Messenger or Telegram bot logging for users who don't want another app | P2 |
| FR-B-15 | Receipt or delivery-app screenshot import | P2 |

### C. Calorie, macro & nutrient tracking

| ID | Requirement | P |
|----|------------|---|
| FR-C-01 | Daily and weekly calories, protein, carbohydrate, fat, fibre | P0 |
| FR-C-02 | Plate-balance view using Bangladeshi healthy-plate guidance (rice/veg/protein portions), not only numbers | P0 |
| FR-C-03 | Micronutrients most relevant locally (iron, vitamin A, calcium, zinc, vitamin D, B12) shown with a **confidence range** (tables disagree — §4.1) | P1 |
| FR-C-04 | Sodium and oil awareness (salt, achar, dried fish, fried items) | P1 |
| FR-C-05 | Sugar from tea/sweets/soft drinks/juice shown as spoons of sugar | P1 |
| FR-C-06 | Glycaemic load estimate for common meals with "swap" suggestions | P1 |
| FR-C-07 | Water intake with heat-adjusted reminders | P1 |
| FR-C-08 | Dietary diversity score (food groups/day) to flag protein/vegetable gaps | P2 |

### D. Exercise & activity

| ID | Requirement | P |
|----|------------|---|
| FR-D-01 | Activity logging with MET-based energy: walking, jogging, cycling, cricket, football, badminton, swimming, yoga, home bodyweight, household chores; prayer-related movement respectful & optional | P0 |
| FR-D-02 | Step and activity entry — **manual steps input** (web substitute: phone step counters unreadable in a browser; see §1.1a) | P0 |
| FR-D-03 | Net-calorie logic (subtract resting energy) so exercise is not over-credited | P0 |
| FR-D-04 | No-equipment, small-space plans: rooftop/balcony/room workouts; low-noise apartment options | P1 |
| FR-D-05 | Context-aware suggestions: heat index, rain, air quality, load-shedding, daylight → indoor switch when AQI poor or very hot | P1 |
| FR-D-06 | Prayer-time and Ramadan-aware scheduling: slots after fajr, between prayers, after iftar | P1 |
| FR-D-07 | Women-friendly privacy mode: home-only plans, no public leaderboard by default, modest-wear-friendly options | P1 |
| FR-D-08 | Beginner progression (10→30 min walks) + physical-activity-pyramid guidance from national guidelines | P1 |
| FR-D-09 | Gym-light strength plans with resistance bands | P2 |
| FR-D-10 | Exercise safety: warm-up, heart-rate caution, "stop if" warnings | P2 |

### E. Calorie balance engine (headline)

| ID | Requirement | P |
|----|------------|---|
| FR-E-01 | 7-day rolling energy budget (§3.2) | P0 |
| FR-E-02 | Overshoot detection with gentle, shame-free message | P0 |
| FR-E-03 | Spread plan for next 3–7 days with intake trims + exercise minutes, each with maths and ±range | P0 |
| FR-E-04 | User controls: window length, 60/40 split, exercise types, days off (FR-REBAL-11) | P0 |
| FR-E-05 | Hard safety floors and caps (FR-REBAL-06/07, FR-SAFETY-*) | P0 |
| FR-E-06 | Planned-feast mode for Eid/weddings/gatherings | P1 |
| FR-E-07 | Adaptive TDEE with confidence indicator (§3.3) | P1 |
| FR-E-08 | "What if?" simulator: "If I eat this biriyani now, what changes this week?" before eating | P1 |
| FR-E-09 | Reverse mode: "I want to eat X on Friday — plan Tuesday to Thursday" | P1 |
| FR-E-10 | Weight-trend chart with noise smoothing and notes (Eid, illness, travel, cycle) | P2 |

### F. AI coach (RAG-powered)

| ID | Requirement | P |
|----|------------|---|
| FR-F-01 | Chat in Bangla, English, and Banglish | P0 |
| FR-F-02 | Grounded answers with **citations** to the retrieved source (FCTB row, guideline section) | P0 |
| FR-F-03 | Deterministic numbers: LLM calls tools for calories/exercise; never invents them | P0 |
| FR-F-04 | Refusal and redirect rules for medical, drug, and extreme-diet questions | P0 |
| FR-F-05 | Meal suggestions fitting remaining budget, user's cost band, and season (hilsa, winter veg, mango) | P1 |
| FR-F-06 | Smart swaps: less rice/more dal & veg, bake instead of deep-fry, less-sugar tea, local alternatives | P1 |
| FR-F-07 | Cheap-protein finder: protein per taka from current bazar prices (egg, dal, small fish, soybean, chicken) | P1 |
| FR-F-08 | Explain "why" for every suggestion in one sentence | P1 |
| FR-F-09 | Weekly review: what went well, one thing to try, no scolding | P1 |
| FR-F-10 | Proactive nudges timed to the user's routine (not spam) | P2 |
| FR-F-11 | Voice reply in Bangla | P2 |

### G. Personalisation

| ID | Requirement | P |
|----|------------|---|
| FR-G-01 | Deshi-first food intelligence: dishes, spellings, regional variants, cooking styles without searching a Western DB | P0 |
| FR-G-02 | Regional variants (Dhaka, Sylhet, Chattogram, Barishal, Rajshahi, Rangpur) — home region tunes defaults | P1 |
| FR-G-03 | Plate/bowl personalisation: user photographs own plate/bati once; estimates use those references | P1 |
| FR-G-04 | Ramadan mode: iftar/sehri plans, hydration schedule, light-exercise timing, no deficit pressure during fasting unless opted in | P1 |
| FR-G-05 | Taka-aware planner: weekly meal plan inside a budget + shopping list | P1 |
| FR-G-06 | Family and caregiver mode: one family menu serving the user's goal and others (children, elders, family member with diabetes) | P1 |
| FR-G-07 | Seasonal and festival calendar: pitha season, Eid, Pohela Boishakh panta-ilish, Durga Puja — respectful, non-judgemental guidance | P1 |
| FR-G-08 | Condition-aware modes (with safety gates + disclaimer): diabetes-friendly and hypertension-friendly plates from national guidelines' disease sections | P1 |
| FR-G-09 | Para/office/university challenges with team goals, not individual weight competition | P2 |
| FR-G-10 | Dietitian handoff: export weekly summary PDF | P2 |
| FR-G-11 | Lab-report OCR (blood sugar, lipid) Bangla/English adjusting advice with consent | P2 |
| FR-G-12 | Community-contributed recipes, moderated and nutritionist-verified | P2 |

### H. Habits, motivation & UX

| ID | Requirement | P |
|----|------------|---|
| FR-H-01 | Fast home screen: today's calories, rice portion, plate balance, one next action | P0 |
| FR-H-02 | Non-judgemental language everywhere; no red "over" labels | P0 |
| FR-H-03 | Streaks that forgive ("5 of last 7 days" instead of "streak lost") | P1 |
| FR-H-04 | Home-screen widget and quick-log notification | P1 |
| FR-H-05 | Dark mode and large-text accessibility; low-literacy mode with icons and voice | P1 |
| FR-H-06 | Light gamification: badges for balanced plates and vegetable variety — **not** for extreme restriction | P2 |

### I. Offline, performance & cost

| ID | Requirement | P |
|----|------------|---|
| FR-I-01 | Offline core via **PWA**: logging, food JSON snapshot, plan and engine work without internet (coach/photo online-only — §1.1a) | P0 |
| FR-I-02 | Installable web app, small footprint, tested on a low-end phone | P0 |
| FR-I-03 | On-device photo model (quantised) for common foods; cloud fallback for hard cases | P1 |
| FR-I-04 | Sync when online with conflict-safe merging | P1 |
| FR-I-05 | Data-saver mode: compress images, defer uploads to Wi-Fi | P1 |
| FR-I-06 | Mobile-financial-service payment for premium tier (check provider integration first) | P2 |

### J. Privacy, safety & trust

| ID | Requirement | P |
|----|------------|---|
| FR-J-01 | Clear consent, data-minimisation, delete-my-data | P0 |
| FR-J-02 | Health-data encryption at rest and in transit | P0 |
| FR-J-03 | Visible medical disclaimer and safety screening (§3.4) | P0 |
| FR-J-04 | Local-first storage option (data stays on device unless user opts in) | P1 |
| FR-J-05 | Audit log for AI suggestions (what was retrieved and why) | P1 |
| FR-J-06 | Content review by a registered nutritionist for seed database and rules | P1 |
| FR-J-07 | Bias check across age groups, sexes, and body types | P2 |

### K. Admin & data operations

| ID | Requirement | P |
|----|------------|---|
| FR-K-01 | Admin panel to add/edit foods, recipes, prices | P1 |
| FR-K-02 | "Report wrong calories" button feeding a review queue | P1 |
| FR-K-03 | Source tag on every food row: measured / FCTB / borrowed / user-submitted / estimated | P1 |
| FR-K-04 | Analytics dashboard: most-logged foods, missing foods, regional trends (anonymised) | P2 |

---

## 5. Non-Functional Requirements

| ID | Requirement | Source |
|----|------------|--------|
| NFR-01 | Offline core flow via PWA (logging, food snapshot, plan, engine); cloud AI optional | §2 G9, §6-I |
| NFR-02 | Installable web app, small footprint; tested on low-end phone | §6-I, §3 |
| NFR-03 | Multilingual: Bangla, English, Banglish; Bangla numerals option | §2 G1, §6-A |
| NFR-04 | Non-judgemental tone everywhere; forgiving streaks; no punishment language | §6-H, §5.5 |
| NFR-05 | Health data encrypted at rest and in transit; consent + delete-my-data | §6-J |
| NFR-06 | All AI numbers trace to deterministic tools or retrieved sources; answer format = short answer + "Source: section name" | §7.1, §7.2 |
| NFR-07 | Every food row carries a source tag; micronutrients shown as ranges, not false precision | §4.1, §6-K |
| NFR-08 | Photo/parse results always editable; one clarifying question max when needed | §7.3, §7.4 |
| NFR-09 | App usable without tutorial (fast home screen, one next action) | §6-H |
| NFR-10 | Not a medical device — no diagnosis, ever | §5.5 |

---

## 6. Data Model (entities derived from Research §4, §5, §6)

> Fields listed are those the checklist and engine require; exact schemas are implementation detail.

| Entity | Key content | Source |
|--------|-------------|--------|
| **FoodItem** | Bangla/English names, aliases, region tags, per-100g and per-serving macros/micros, **source tag** (measured/FCTB/borrowed/user/estimated), household-measure conversions, confidence range, season/price references | §4.1, §6-B/K |
| **Recipe** | Ingredients, oil, servings, cooking method; per-serving values; owner label ("Amma's dal") | §6-B |
| **MealLog** | Date/time, items + quantities (household measures or grams), method (text/voice/photo/preset), editable result, confidence, source | §6-B, §7.3–7.4 |
| **Profile** | Age, sex, height, weight, activity, goal, pace, eating style, budget band (taka), household, routine (work/prayer/commute), **safety-screen results**, home region, calibrated plate/rice portion | §6-A, §6-G |
| **HealthMeasure** | Weight trend entries (with notes: Eid, illness, travel, cycle), waist circumference, waist-to-height ratio; Asian BMI display (23/27.5) | §3, §5.3, §6-A |
| **ActivityLog** | Activity type, duration, MET energy, net energy; steps import | §5.1, §6-D |
| **BudgetState** | 7-day rolling budget, today's target, overshoot, recovery plan (window, split, daily trims/minutes), personal floor, caps | §5.2 |
| **PriceRecord** | Bazar price per kg for common foods, by season | §4.4 |
| **RAGChunk** | Text from guidelines/FCTB notes/FAQs + metadata (source, section, language, date) | §7.2 |
| **AuditLog** | AI suggestion audit: what was retrieved and why | §6-J |

> Existing repo tables `habits`/`habitLogs` remain available for activity/habit-style logging; the product's core entities above are additive (see ENDPOINTS.md status column).

---

## 7. External Interfaces

| Interface | Purpose | Ref |
|-----------|---------|-----|
| Groq API (OpenAI-compatible REST) | LLM: Bangla/Banglish understanding, tool-calling, friendly explanations — **numbers only via tools** | §7.1 (LLM layer); current repo integration `convex/ai.ts` |
| Convex | Structured data (food DB, logs, profile, budget state), queries/mutations, deterministic engine host | §7.1 (structured + engine layers) |
| Embedding + vector search | Hybrid RAG retrieval over guidelines corpus with Bangla-capable multilingual embeddings | §7.2 |
| Vision model | Photo segmentation/classification (FoodBD-trained baseline → cloud fallback) | §4.2, §7.4 |
| Bangla speech-to-text | Voice logging input | §6-B |
| Phone health APIs | Step/activity import | §6-D |

---

## 8. Acceptance Criteria (from Research §8 evaluation + demo §9)

| # | Criterion | Verification (§8) |
|---|----------|-------------------|
| AC-01 | Calorie error on 50–100 weighed home-style plates reported as MAPE; compare against a generic global app on same plates — **do not promise a number before measuring** | Weighed-meal evaluation |
| AC-02 | Food-name parsing: 200 Bangla/English/Banglish log lines → correct-item and correct-portion rates reported | Parsing accuracy set |
| AC-03 | RAG: 50 guideline questions → retrieval hit rate + groundedness reported; answers cite sources | RAG eval set |
| AC-04 | Safety: 30 red-team prompts → pass rate reported; show two failure fixes | Red-team (§7.5) |
| AC-05 | Rebalancing sanity: simulated users with overshoots → no plan violates floor or caps | Simulation tests |
| AC-06 | Usability: 5–10 real users log a day; report average logging time per meal | User test |
| AC-07 | P0 checklist (Research §6 tagged P0) works in live demo | Demo script §9.1 |
| AC-08 | Limits stated honestly (mixed dishes, street food, portion error) | §8 closing |
| AC-09 | Buildathon sticker visible in navbar | Buildathon rules (existing) |
| AC-10 | App deploys and runs without errors | Deployment test |

**Never cut (§10.2):** safety gates, citations, rebalancing engine.
