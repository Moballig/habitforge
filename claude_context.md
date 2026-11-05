# Deshi Health Companion — Comprehensive Project Context for Frontend Redesign

> **Buildathon Project:** Built for *Ostad Presents YUNet AIgnite Buildathon 2026* (November 1–5, 2026)  
> **Repository / Codebase:** `habitforge` (Next.js 16 App Router + Tailwind CSS v4 + Convex Realtime DB + Groq AI)  
> **Target Audience:** Bangladeshi adults and families seeking sustainable health, weight management, and nutrition without abandoning cultural staples (rice, dal, fish, shared-pot meals) or violating clinical safety guidelines.

---

## 1. Executive Summary & Cultural Problem Statement

In Bangladesh, standard global fitness and calorie apps (MyFitnessPal, Lose It!, Apple Health) fail completely due to cultural disconnect:
1. **The White-Rice Reality:** Rice is ~630 g/day (~80% of caloric intake in many households). Telling a Bangladeshi user to "cut out carbs" or "stop eating rice" leads to immediate abandonment. Instead, the app provides rice bati calibration, visual plate balancing, and GI-aware swaps.
2. **South Asian Dysglycaemia & Asian BMI Action Points:** Diabetes prevalence is 13.2% (IDF 2024, 2nd highest in South Asia). Metabolic risk starts much earlier: Asian BMI cutoffs are **23 kg/m² (overweight/action point)** and **27.5 kg/m² (obese)**.
3. **Shared-Pot Domestic Cooking:** Meals are cooked in a single family pot (e.g. 1000g of dal or curry) and eaten with family. Users cannot weigh raw chicken breasts in isolation; they need shared-pot fraction math (e.g. 1/5th of the handi).
4. **Environmental & Daily Constraints:** 
   - **Extreme Heat & AQI:** Dhaka frequently experiences dangerous AQI (>150–300) and heat index (>38°C). Outdoor running is often clinically hazardous.
   - **Religious & Cultural Rhythms:** 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) and Ramadan fasting dictate hydration and movement windows.
   - **Privacy for Women:** Many women prefer home workouts in modest house-wear without public exposure or social leaderboards.
   - **Apartment Density:** High-rise city living requires low-noise exercises that don't disturb neighbors below.
5. **Economic Sensitivity:** Protein sources must be evaluated by **cost per 100 Taka (৳)** against real local market benchmarks (TCB/WFP 2026 prices for eggs, lentils, pangas fish, soy).
6. **No "Scale Panic":** Transient scale spikes after wedding feasts (*dawat*), salty food, or menstrual cycles are water retention, not fat gain.

---

## 2. Technical Stack & Architecture

- **Frontend Framework:** Next.js 16 (App Router, Turbopack, Bun runtime).
- **Styling & Design System:** Tailwind CSS v4, Lucide React icons, custom SVG charts (no heavy chart libraries).
- **Typography:** 
  - English: `Manrope` (clean, contemporary sans-serif).
  - Bengali: `Hind Siliguri` (highly legible, balanced Bengali typography).
  - Numbers: `JetBrains Mono` / tabular numbers for calorie and weight readouts.
- **Backend & Database:** Convex (`dev:disciplined-zebra-716`) with reactive real-time queries and mutations:
  - `profiles`, `mealLogs`, `activityLogs`, `weighIns`, `waterLogs`, `weatherState`, `ragChunks`, `foodFacts`, `recipes`.
- **Deterministic Engine (`src/lib/engine/`):** 
  - Pure TypeScript, zero hallucination: all BMR (Mifflin-St Jeor), TDEE, Asian BMI, rolling deficit rebalances, MET calorie burns, and solar prayer times are 100% deterministic (134 unit tests passing).
- **AI & RAG Layer:** Groq (`openai/gpt-oss-120b` for chat, `qwen/qwen3.8-27b` for photo analysis), local `Xenova/multilingual-e5-small` embeddings (384d) for 9,447 chunks from the *National Dietary Guidelines for Bangladesh (Aug 2025)* and FCTB.
- **Internationalization (i18n):** Native bilingual support (Bangla `bn` & English `en`) with instant switching, plus low-literacy and large-text toggles.

---

## 3. Design System & Theme Tokens

### Color Palette (Tailwind Tokens)
- **Primary / Brand:** Violet (`#6366f1` / `#4f46e5`) — representing calm intelligence and discipline.
- **Accent / Healthy Energy:** Mint / Emerald (`#10b981` / `#059669`) — for targets achieved, hydration, balanced meals.
- **Warmth / Feast / Alert:** Peach / Coral (`#f59e0b` / `#fb923c` / `#f43f5e`) — for calorie overshoot, warnings, feast recovery.
- **Cool / Calm / Water:** Sky / Cyan (`#0ea5e9` / `#06b6d4`) — for hydration tracking, outdoor weather, walks.
- **Modesty / Privacy:** Rose / Lilac (`#f43f5e` / `#a855f7`) — for Women-Friendly Home Mode, yoga, gentle movement.
- **Surface / Background:** Soft Claymorphism / Neumorphic-influenced cards:
  - Light Mode: `#f8fafc` background, `#ffffff` card surface, soft borders (`rgba(0,0,0,0.06)`), subtle inner glows.
  - Dark Mode: `#09090b` background, `#18181b` card surface, `#27272a` borders.

### Shell Layout Structure
```
┌────────────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo / Title] [Buildathon Badge] [Offline/Sync Pill] [Theme] │
├──────────────┬──────────────────────────────────────────┬──────────────┤
│ SideNav      │ Main Scrollable Content Area             │ RightPanel   │
│ (Desktop)    │ (Max width ~640px–1024px centered)       │ (Desktop     │
│ - Home       │                                          │  Summary &   │
│ - Log Meal   │                                          │  Quick Stats)│
│ - Plan       │                                          │              │
│ - Activity   │                                          │              │
│ - Insights   │                                          │              │
│ - Family     │                                          │              │
│ - Coach      │                                          │              │
│ - Settings   │                                          │              │
├──────────────┴──────────────────────────────────────────┴──────────────┤
│ BottomTabs (Mobile: Home · Log · Plan · Activity · Coach)             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Route-by-Route Breakdown & UI Components

### 1. Home Page (`/home`) — The Daily Command Center
- **Energy Budget Banner:**
  - Shows Maintenance TDEE, Safe Floor (never below BMR), and Today's Target.
  - Large Calorie Ring SVG displaying Eaten (low–high range) vs Target.
  - Rice Portion Notice: shows calibrated rice portion (e.g. "1 medium bati ≈ 180g / 234 kcal").
- **Condition-Aware Deshi Plate Presets:**
  - Interactive tabs: *General Healthy Plate*, *Diabetes Management*, *Hypertension / Low Salt*, *Ramadan Fasting*.
  - Visual plate ratios (50% vegetables/shak, 25% grains/rice, 25% protein/fish/dal).
  - Official Clinical Disclaimer citing *National Dietary Guidelines for Bangladesh (2025)* with physician referral notice.
- **"Next Move" Calorie-Driven Recommender:**
  - Intelligently recommends the next best action depending on hour, remaining calorie budget, and weather:
    - *Morning/Afternoon:* Suggests specific meal or snack closing protein gaps.
    - *Over Budget:* Recommends gentle, capped activity (e.g. 15–30 min brisk walk or rooftop pacing) to balance excess without starvation.
    - *Late Evening:* Prompts restorative rest with zero guilt.
- **Hydration Tracker Card:**
  - Progress bar + 8-glass (2000 ml) target.
  - Quick action: `+250ml Glass` button with instant animation and undo capability.

### 2. Log Page (`/log`) — Frictionless Cultural Logging
- **Quick Action Bar:**
  - Instant sheets: *Recents*, *Favourites*, *Copy Past Meal*, *Same as Yesterday*.
- **Bangla / Banglish Text Parser:**
  - Natural input: e.g. `"dupure 2 ta ruti, dim bhaji, 1 cup dudh cha"`.
  - Matched against 318 curated Deshi food items with calibrated gram and kcal ranges.
- **Sub-Modality Logging Routes:**
  - `/log/photo`: AI Camera Scanner (Qwen 3.8-27b vision) returning bounding boxes, item recognition, and portion classes.
  - `/log/rice`: Interactive rice bati selector (Small / Medium / Large / Heaped bati) with instant kcal feedback.
  - `/log/street`: Quick logger for street snacks (*Fuchka, Chotpoti, Singara, Samucha, Jilapi, Morog Polao*).
  - `/log/recipe`: Shared-pot cooking calculator (input total pot ingredients + fraction eaten, e.g. 1/4 of handi).

### 3. Plan Page (`/plan`) — 7-Day Rolling Deficit & Feast Manager
- **Rolling Weekly Energy Rebalancer:**
  - Graphs 7 days (Mon–Sun) with actual intake vs targets.
  - Avoids crash diets by spreading calorie adjustments over 3 to 7 days.
- **Post-Feast Recovery vs Pre-Bank Catch-Up:**
  - Presets: *500 kcal Biriyani / Tehari*, *800 kcal Wedding Dawat*, *1200 kcal Eid Feast*.
  - Computes a gentle 2–5 day recovery plan absorbing 60% of overshoot without guilt or dipping below BMR.
- **"What-If" Simulator Stepper:**
  - Interactive slider (+100 to +1000 kcal): "If I eat this kacchi biriyani tonight, how does my weekly target adjust?"
- **Rebalance Controls:** Adjust rebalance window (3–7 days) and intake vs activity split (60% food trim / 40% movement).

### 4. Activity Page (`/activity`) — Context-Aware Physical Movement
- **Localized Weather & Air Quality Badge:**
  - Connects to Open-Meteo for all 8 Bangladesh administrative divisions (Dhaka, Chattogram, Sylhet, Rajshahi, Khulna, Barishal, Rangpur, Mymensingh).
  - Automatic **Indoor Switch Notice** when AQI ≥ 151 or Heat Index ≥ 38°C, muting outdoor workouts.
- **Women-Friendly Privacy Mode:**
  - Header toggle badge: `🌸 Women-Friendly Home Mode [ON/OFF]`.
  - Replaces outdoor cycling/jogging with modest home bodyweight routines comfortable in loose house-wear.
- **5-Prayer Time Strip & Safe Activity Windows:**
  - Displays solar times for Fajr, Dhuhr, Asr, Maghrib/Iftar, Isha/Taraweeh.
  - Identifies 4 safe workout slots: *Post-Fajr morning walk*, *Pre-Maghrib gentle stroll* (fasting-safe walk only), *Post-Iftar digestive walk*, *Post-Taraweeh active session*.
  - Highlights `Active now` or `Next up` based on current clock.
- **Small-Space & Low-Noise Apartment Routines:**
  - Step-by-step collapsible guides for Dhaka apartments:
    1. *Rooftop Brisk Walk* (25 min, MET 4.0).
    2. *Quiet Apartment Bodyweight* (20 min, zero jumping, neighbor-safe).
    3. *Balcony Mobility & Posture* (15 min, shoulder & thoracic relief).
    4. *Hallway Continuous Pacing* (15 min, indoor rainy-day pacing).
  - One-tap button: `Log this workout (+20 min)`.
- **Beginner Walk Progression (10→30 min):**
  - 4-week step-up selector: Week 1 (10m), Week 2 (15m), Week 3 (20m), Week 4 (30m / 150 min goal).
  - Expandable **National Physical Activity Pyramid (2025)** guide with 4 tiers (Active Living, Cardio, Strength, Sedentary).
- **Habit Sparklines & WHO 150-Minute Week Gauge.**

### 5. Insights Page (`/insights`) — Analytics & Food Economics
- **Dual-Line Weight Trend Chart (AreaChart):**
  - Solves scale panic: renders **Raw Daily Weigh-Ins** (white line) alongside **7-Day Smoothed Trend** (emerald dashed curve).
  - Event Context Tagging: Dropdown selector when logging weight (*Eid Feast, High Sodium Meal, Menstrual Cycle / Water Retention, Travel, Illness*).
  - Renders tagged chips with educational clinical reassurance ("1–2 kg jumps after feasts reflect glycogen/water retention, not fat gain").
- **Adaptive TDEE Gauge:**
  - Compares logged intake against smoothed weight change over 14 days; shows confidence score (e.g. 75% settled).
- **Cheap-Protein Finder (Protein per ৳100):**
  - Ranks affordable Bangladeshi protein sources using real Dhaka market benchmarks:
    - *Staple Dal (Masoor, Mug, Chola)*
    - *Fish (Pangas, Tilapia, Rui)*
    - *Poultry & Eggs (Farm egg, Broiler)*
    - *Soybean & Seeds*
  - Daily Protein Cost Calculator (slider for 45g, 60g, 75g, 90g target).
- **Ramadan Fasting Mode Drawer:**
  - Paced 9-glass hydration timeline between Iftar and Sehri.
  - Zero-Deficit clinical guardrail badge.

### 6. Family Mode (`/family`) — Shared Pot, Individual Needs
- One single shared household menu (e.g. Morog Polao or Rice + Rui Macher Jhol + Dal).
- Per-person portion scaling by relation factor:
  - *Toddler/Child (0.5x)*
  - *Teenager (0.75x)*
  - *Adult (1.0x)*
  - *Elderly / Grandparents (0.8x)*
- Medical condition tags (e.g. diabetic grandparent gets brown rice recommendation; hypertensive father gets low-salt broth warning).

### 7. AI Health Coach (`/coach`) — Grounded Nutritionist
- Chat interface in Bangla, English, or Banglish.
- RAG-grounded with `[n]` citation chips linking to official Bangladesh dietary guidelines.
- Strict numeric validator: refuses to generate arbitrary ungrounded calorie counts.
- Failsafe safety mode: auto-refuses crash diets, laxatives, and eating-disorder prompts.

### 8. Settings & Onboarding (`/settings`, `/onboarding`)
- Collects Age, Sex, Height, Weight, Activity, Division (for weather), Rice Portion preference, Health Conditions.
- Calculates Asian BMI band and BMR/TDEE floors.
- Full privacy controls: one-click GDPR data wipe and audit trail.

---

## 5. What the Frontend Needs from Claude

When designing a fresh UI / component library for this application, Claude should focus on:

1. **Cultural Warmth & Trust:**
   - Avoid generic sterile hospital blue or Silicon Valley SaaS grey. Use warm, comforting, fresh tones (turmeric/peach, fresh neem/mint, soft terracotta, deep indigo/violet).
   - Ensure Bengali script (`Hind Siliguri`) renders with generous line-heights (`leading-relaxed` or `leading-loose`) so vowels and diacritics never clip.
2. **High Information Density with Visual Simplicity:**
   - Bangladeshi users often navigate on compact smartphone screens (360px–400px width).
   - Use smart collapsible cards, segmented pill switches, and horizontal scrolling badge carousels.
3. **Instant Clarity for Numbers & Units:**
   - Display Bengali numerals (`১২৫০ kcal`) seamlessly when the interface is in Bangla.
   - Show calorie ranges (`≈ 350–420 kcal`) rather than false single-integer precision.
4. **Delightful Micro-Interactions:**
   - Water glass logging: satisfying ripple or bubble filling animation when tapping `+250ml`.
   - Rebalance slider: visual elastic band showing how excess calories stretch across the remaining week days.
   - Weather badge: pulse indicator showing whether outdoor or indoor exercise is advised today.
5. **Component Primitives to Produce:**
   - Stat tiles, progress semi-gauges, range bars, plate visualizers, collapsible workout drawers, and recipe share cards.

