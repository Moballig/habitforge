# Deshi Health Companion: Market Research and Hackathon Feature Checklist

*Research date: 2 Nov 2026. Working title for the product: **Deshi Health Companion** (rename freely).*

A Bangladesh-first calorie, diet and exercise-balancing app with an AI coach grounded by RAG on local food and health data.

**How to read this document**

- Section 1 to 3: what exists today, what is missing, and why Bangladesh needs its own product.
- Section 4: the data you can actually get (food tables, image datasets, national guidelines).
- Section 5: the core "eat more, then rebalance over the next few days" engine, with a worked example and safety rules.
- Section 6: the detailed feature checklist, tagged by priority.
- Section 7 to 10: RAG architecture, evaluation, demo script, risks, build plan.
- Section 11: sources.

**Evidence labels used below**

- **[Sourced]** came from a source in Section 11.
- **[Vendor claim]** came from a company or a competitor's marketing blog. Treat as unverified.
- **[Design]** is my recommendation, not a researched fact. Tune it with a nutritionist.

**Honest limits of this research:** it is based on web search, not hands-on testing of every app. Many "best app" articles are written by competing app makers, so rankings and accuracy numbers are biased. Prices change often. Before you put any competitor number on a slide, open the source and re-check it.

---

## Table of contents

1. [Market landscape: what exists](#1-market-landscape-what-exists)
2. [Bangladesh and South Asia: what is missing](#2-bangladesh-and-south-asia-what-is-missing)
3. [Why Bangladesh needs a different product (health context)](#3-why-bangladesh-needs-a-different-product)
4. [Data you can use](#4-data-you-can-use)
5. [Core engine: calorie balance and "rebalance over the next days"](#5-core-engine-calorie-balance-and-rebalancing)
6. [Feature checklist](#6-feature-checklist)
7. [RAG and AI architecture](#7-rag-and-ai-architecture)
8. [Evaluation: how to prove it works](#8-evaluation-how-to-prove-it-works)
9. [Demo script and judging map](#9-demo-script-and-judging-map)
10. [Risks and build plan](#10-risks-and-build-plan)
11. [Sources](#11-sources)

---

## 1. Market landscape: what exists

### 1.1 Global apps

| App | What it is known for | Weak spot for a Bangladeshi user | Price signal |
|---|---|---|---|
| **MyFitnessPal** | Very large food database, barcode scan, social features. [Sourced] | Same dish can have many conflicting entries (one report found six entries for one Indian dish ranging from 95 to 420 kcal). Many useful features sit behind a paywall. [Sourced] | Free tier, paid roughly $20/month [Sourced] |
| **Cronometer** | Deep micronutrient tracking (reported 84 nutrients), curated database. [Sourced] | Very Western/US-centred food coverage; heavy for casual users. | Free + paid |
| **Lose It!** | Beginner-friendly, simple UI, photo "Snap It". [Sourced] | Indian/South Asian coverage described as reasonable but shallow. [Sourced] | Freemium |
| **MacroFactor** | **Adaptive TDEE**: recalculates your real energy expenditure weekly from your weight trend and food log, then adjusts targets. No shaming colours. [Sourced] | Paid only, no free tier; no Bangladeshi food depth. | About $11.99/month or $70-72/year, no free tier [Sourced] |
| **Yazio, Lifesum, FatSecret, MyNetDiary** | Mainstream trackers with meal plans. [Sourced] | Western food focus. | Freemium |
| **Cal AI, SnapCalorie, Foodvisor, Calorie Mama, Nutrify** | Photo-first logging. SnapCalorie advertises LiDAR depth sensing for portion size on Pro iPhones. [Sourced] | Trained mainly on Western meals. Mixed plates (rice + dal + bhorta + curry) are the hard case. Portion size is the hardest problem in photo tracking for every app. [Sourced] | Freemium |
| **Protokl and similar "all-in-one" apps** | Tie AI food logging to training and body composition. [Vendor claim] | Not localised. | Paid |

**Photo accuracy: what is credible.** Reviews say photo apps are typically within about 10 to 20% on simple, clearly plated meals and worse on mixed dishes and sauces. [Sourced, secondary] Vendor pages quote 85 to 95%. [Vendor claim] The consistent finding across sources is that the best systems combine image recognition with a verified food database, editable portions, and a second input method (text, voice, barcode).

**What global apps do well that you should copy**

- Adaptive TDEE from weight trend and intake (MacroFactor's core idea).
- Fast logging: photo, voice, barcode, "log again", recent and frequent foods.
- Non-judgemental tone: no red numbers, no "you failed" messaging.
- Multiple input methods reconciled against one verified database.

**What global apps get wrong (the opening for you)**

- The 1,200 kcal default floor is an industry legacy from early trackers, not a clinical rule, and can push some users toward unsafe restriction. [Sourced, from a competitor blog; the safety concern itself is widely discussed]
- Exercise "earn-back" calories are often over-credited because activity estimates carry error (about ±15% for steady activities by the MET method). [Sourced, secondary]
- Almost none are designed around rice-centred, home-cooked, shared-pot eating.

### 1.2 India: the closest regional comparison

| App | Notes |
|---|---|
| **HealthifyMe** | The most downloaded Indian tracker. Claims a database of 100,000+ Indian and South-East Asian foods, with household measures such as katori and plate. Regional cuisines including Bengali are mentioned. Has "Ria" AI coach and photo recognition. [Sourced; some figures are vendor or reseller claims] An earlier press report said its photo recognition covered 150,000 Indian food items with a claimed 60-70% auto-recognition accuracy; a later review site claims about 90%. These numbers conflict, so do not quote either without checking. |
| **Nutrimate (India)** | Self-published comparison says it offers WhatsApp meal logging, a "caregiver" feature for family nutrition, and a daily health score. [Vendor claim] Useful as a feature idea, not as evidence. |
| **Free "India-friendly" trackers** | Compete on free macros and a larger Indian database. [Vendor claims] |

**Lesson:** India proves there is demand for a local-food tracker. HealthifyMe still leans on manual search in a large database, treats "Bengali" as one region among many, and is priced in rupees. None of this serves Bangladeshi home cooking, Bangla language, or Bangladeshi context.

### 1.3 Bangladesh: what I could find

Search results show that **Bangladeshi users mostly install global apps**. A Google Play top-chart snapshot for Health & Fitness in Bangladesh lists Cal AI, Fastic, and EasyFit-style calorie counters, not a local product. [Sourced]

Local products I found are small and basic:

- **Deshi Diet Plan**: a simple deshi food calorie and protein calculator with Bangla food names, listed on Product Hunt. [Sourced]
- **Bangla-only BMI/BMR/calorie-need calculators** (for example an open-source Bangla app on GitHub, and small Play Store apps). [Sourced]
- **AjkerMenu**: a healthy homemade-food delivery service, not a tracker. [Sourced]
- **On-call nutritionist concept sites**: still under development. [Sourced]
- Bangladeshi news sites have published "best calorie apps" lists that only recommend global apps (MyFitnessPal, Lose It!, and so on). [Sourced]

**Conclusion (with a caveat):** I did not find a mature, Bangla-first tracker with a strong deshi food database, photo recognition, and AI coaching. This was found by search only, so run a quick Play Store check yourself before claiming "first".

---

## 2. Bangladesh and South Asia: what is missing

These are the gaps that your product can own. Each one is turned into features in Section 6.

| # | Gap | Why it matters |
|---|---|---|
| G1 | **Language**: no strong Bangla (and Banglish) logging, Bangla voice input, or Bangla coaching. | Many users think and type in Bangla or mixed Bangla-English. |
| G2 | **Food depth**: global databases treat "curry" or "dal" as one item. | Calories change a lot with oil, cut of fish, shutki, bhorta style, and region. |
| G3 | **Measures**: grams and cups are unnatural. | People think in plate fractions, bati, spoons, pieces, and "one ladle". |
| G4 | **Shared-pot cooking**: the user rarely knows the recipe or the weight of what they ate. | Family cooks once and everyone serves themselves. |
| G5 | **Rice-centred plates**: a large share of calories comes from rice. | A rice portion error dominates the whole log. A rice-specific tool beats a generic one. |
| G6 | **Local risk profile**: diabetes and high body fat at lower BMI. | Western BMI cut-offs under-warn. See Section 3. |
| G7 | **Context**: Ramadan, Eid, winter pitha, hilsa season, heat, monsoon, air pollution, prayer times, load-shedding. | Generic exercise advice ignores daily reality. |
| G8 | **Cost**: no app reasons in taka per nutrient. | Budget is a real constraint, so "healthy" advice must be affordable. |
| G9 | **Connectivity**: cost of data and uneven coverage. | Cloud-only AI apps fail offline. |
| G10 | **Overshoot handling**: apps tell you you're "over" but do not plan a gentle recovery across days. | This is your headline feature. |
| G11 | **Safety**: calorie targets and exercise advice can harm people with diabetes, eating disorders, or low BMI. | Responsible AI is a judging advantage if you show it. |

---

## 3. Why Bangladesh needs a different product

Health context that justifies the design. All numbers are from Section 11 sources.

- **Diabetes burden is high and rising.** The 2024 IDF report, as reported by Bonik Barta, puts diabetes at 13.2% of adults aged 20-79 in Bangladesh, second-highest in South Asia after Pakistan. A BMJ Open analysis of national surveys found diabetes prevalence among adults rose between 2011 and 2018, and that overweight and obese adults were more likely to develop it.
- **Lower BMI thresholds for Asians.** The WHO 2004 expert consultation recommended Asian action points of **BMI 23 (overweight)** and **27.5 (obese)**, versus 25 and 30 globally, because Asian populations carry more body fat at the same BMI. A UK study reported South Asian men showing the same blood-glucose abnormality at BMI 22 as white European men at BMI 30. **Design consequence:** show Asian-adjusted BMI categories, add waist circumference, and treat BMI 23+ as the point to discuss risk.
- **Rice dominance.** A 21-country cohort (Diabetes Care, reported in the press) found South Asia's average white-rice intake was about 630 g/day versus about 238 g in South-East Asia and about 200 g in China. Carbohydrates were reported as nearly 80% of calories in many South Asian diets. The study linked higher white-rice intake with diabetes risk, strongest in South Asia. **Design consequence:** a rice calibrator, rice-type GI hints, and "plate method" nudges are the highest-impact features. A Bangladesh Agricultural University study measured glycaemic index for six rice varieties sold in local markets, so you have local GI data to cite.
- **Official guidance exists and is recent.** *National Dietary Guidelines for Bangladesh* was published in August 2025 (National Nutrition Services, with WHO and FAO support). Its contents include a food pyramid, a healthy plate for lunch, a **physical activity pyramid**, **standardised weights and measures for foods**, **food exchange lists**, a self-evaluation checklist, and disease-specific guidance (overweight and obesity, diabetes, kidney disease, liver disease, coronary heart disease, hypertension, hypothyroidism and more). **This is the best RAG corpus you can get**, and it is official.
- **Connectivity reality.** BTRC reports 135.94 million internet subscriptions at the end of June 2026 (subscriptions, not unique people), 120.84 million of them mobile. DataReportal estimated 93.4 million people still offline at the end of 2025. Median mobile download speed was about 36.8 Mbps. Reports repeatedly name data cost as the main barrier. **Design consequence:** offline-first, small app size, and on-device models for the core flow.

---

## 4. Data you can use

### 4.1 Food composition

| Source | What it gives you | Notes |
|---|---|---|
| **Food Composition Table for Bangladesh (FCTB 2013)**, INFS, University of Dhaka, with FAO | The main national table. 20 key foods were freshly analysed; other values were compiled from regional tables. Free access through FAO, with a PDF and an Excel database. | Primary source for calories and macros. Some nutrient values are borrowed or estimated. |
| **FCT 2012 (ethnic foods)**, INFS | About 388 items including selected ethnic foods. | Adds regional items. |
| **Ali and Amin 2020** (*Maternal & Child Nutrition*) | Compares the two Bangladeshi FCTs and finds that estimated nutrient intakes can diverge. | **Design consequence:** show a range or confidence for micronutrients, not false precision. |
| **Mondol and Rahim 2025** (Bangladesh Research Communications) | Standardised **home-cooked recipes** analysed in the lab (vegetable dishes and festival dishes), with nutrient-retention data. States that existing tables focus on raw ingredients and have limited cooked-dish data. | Directly supports your "recipe-based cooked-dish calculator". |
| **FAO/INFOODS regional tables** (India, Vietnam etc.) | Fill gaps where Bangladeshi data is missing. | FCTB itself borrowed from these. Mark borrowed rows. |

### 4.2 Food image datasets (for photo recognition)

| Dataset | Size and labels | Why it matters |
|---|---|---|
| **FoodBD** (published Dec 2025) | 3,523 smartphone meal images, 67 food classes, polygon segmentation (12,575 annotations), with carbohydrate, protein, fat, fibre and calorie values per image, using Bangladesh standard serving guidelines. | Best fit: whole meals, segmentation, nutrition labels. |
| **BD-Food33** (Mendeley, Dec 2025, DIU) | 1,200+ images, 33 local food categories. | Quick classifier baseline. |
| **DeshiFoodBD** (2021) | 5,425 labelled images, 19 famous Bangladeshi foods (English and Bengali labels). | Restaurant and festival dishes. |
| **Aruzz22.5K rice varieties** (Jahangirnagar University) | 4,730 original images across 20 rice varieties (plus augmentations). | Rice-type recognition. |
| Earlier DIU paper | Inception-v3 transfer learning reached about 95.2% on 7 traditional foods (small closed set). | Shows small-set accuracy; real meals are harder. |

**Check each dataset's licence before using it in a product.** For a hackathon prototype this is usually fine; for a launch it is not guaranteed.

### 4.3 Guidelines and health knowledge for RAG

- *National Dietary Guidelines for Bangladesh* (2025): general, life-stage, and disease-specific sections, plus annexes with food plate, activity pyramid, weights and measures, and exchange lists.
- Earlier *Dietary Guidelines for Bangladesh* (FAO/BIRDEM, 2013 revision).
- WHO 2004 Asian BMI consultation.
- Compendium of Physical Activities (MET values).
- BIRDEM/DAB patient education material where licence allows.

### 4.4 Things you must collect yourself (your moat)

- Bazar prices per kg for common foods, by season.
- Street-food and restaurant calorie estimates (fuchka, chotpoti, singara, jhalmuri, biriyani, tehari, khichuri, bhuna khichuri, pitha, mishti).
- Household-measure standards (bati sizes, spoon sizes, plate diameters) measured with a kitchen scale.
- A small expert-reviewed set of **100 to 200 real Bangladeshi meal photos with weighed ingredients** for evaluation.

---

## 5. Core engine: calorie balance and rebalancing

This is the feature the whole product pitch rests on, so build and test it carefully.

### 5.1 Baseline formulas

- **BMR (Mifflin-St Jeor):** men `10 × kg + 6.25 × cm − 5 × age + 5`; women `10 × kg + 6.25 × cm − 5 × age − 161`.
- **TDEE:** BMR × activity factor, then replaced over time by the **adaptive estimate** (Section 5.3).
- **Exercise energy (MET method):** `kcal = MET × kg × hours`. For planning extra burn, use **net** energy: `(MET − 1) × kg × hours`, because you would have burned about 1 MET sitting anyway. The MET method is typically within about ±15% for steady activities. [Sourced, secondary]
- **Energy per kg of body weight change:** about 7,700 kcal per kg is the common rule of thumb, with real results varying by person and over time. [Sourced]
- **Rate of loss:** keep to roughly 0.5 to 1 kg/week (or 0.5 to 1% of body weight per week). [Sourced]
- **Protein during a deficit:** about 1.6 to 2.2 g/kg/day is a commonly cited range. [Sourced, secondary]
- **MET examples used below:** walking at 3.5 mph about 4.3 MET; moderate cycling about 8.0 MET. [Sourced, secondary]

### 5.2 Weekly energy budget with "banking"

Instead of a hard daily limit, give the user a **7-day rolling budget**. An overshoot on Friday becomes a small, spread-out adjustment, not a failure.

**Inputs:** weekly target, today's logged intake, estimated burn, personal safety floor.
**Outputs:** a short, friendly plan for the next 3 to 7 days.

**Rebalancing rules [Design]**

1. Compute `overshoot = intake_today − target_today` (only if positive and above a small tolerance, for example 100 kcal).
2. Choose a recovery window of 3 to 7 days. Default 4.
3. Split the recovery between **small intake trims** and **light extra activity**. Default 60/40. Let the user choose.
4. **Never compensate 100%.** Cover about 50 to 70% of an overshoot and let the weekly weight trend handle the rest. This avoids "punishment" behaviour.
5. **Cap extra activity per day** (default: net 200 kcal/day for beginners, more only if the user already trains).
6. **Never push any day below the personal floor** (default: the user's BMR, not 1,200).
7. **Forgive and forget:** if the user skips the planned walk, silently re-spread the remainder. No red banners.
8. **Eating a lot because of a social occasion is allowed.** Offer a "planned feast" mode that pre-banks a little before Eid, a wedding, or a family dinner.

### 5.3 Adaptive TDEE (copy the MacroFactor idea, adapt it)

- Start with a formula estimate.
- Each week compare the **trend** of body weight (smoothed) against average logged intake.
- Back out the user's real expenditure: `TDEE ≈ average intake − (weight change × 7,700 ÷ days)`.
- Blend slowly (needs a few weeks of consistent data; MacroFactor-like systems take 2 to 3 weeks to settle). [Sourced]
- Be honest when data is thin: show "estimate improving, needs 5 more weigh-ins".
- Handle water and salt noise: warn that Eid weeks, sodium, and menstrual cycle can shift scale weight.

### 5.4 Worked example (illustrative numbers)

A 70 kg adult eats about 500 kcal over target on Friday (biriyani, borhani, mishti).

- **Planned recovery:** about 60% of 500 = 300 kcal over 4 days = 75 kcal/day.
- **Split 60/40:** about 45 kcal/day from small intake trims (for example a slightly smaller rice portion at one meal) and about 30 kcal/day from extra activity.
- **Extra activity cost:** brisk walking at 4.3 MET, net = `(4.3 − 1) × 70 ÷ 60 ≈ 3.85 kcal/min`. Thirty kcal ≈ **8 minutes**.
- **Alternative with more exercise:** if the user prefers to cover 250 kcal by exercise over 4 days, that is about 62 kcal/day ≈ **16 minutes of brisk walking per day**.

Show the user the arithmetic in plain Bangla ("১৬ মিনিট দ্রুত হাঁটা ≈ ৬২ কিলোক্যালরি") with the uncertainty ("±১৫%").

### 5.5 Safety gates [Design, important]

Do these before any plan is shown. They are also strong judging points.

- **Screen at onboarding** for: age under 18, pregnancy or breastfeeding, BMI under 18.5, diabetes on insulin or sulfonylureas, heart or kidney disease, history of eating disorder. For these groups, **turn off deficits and exercise compensation** and show "talk to a doctor or dietitian" with BIRDEM-style referral text.
- **Eating-disorder guardrails:** no streak-shaming, no "burn off that meal" language, no calorie-compensation after binge-like patterns, soft check-in prompts if the user repeatedly logs very low intake or very high exercise.
- **Diabetes mode:** do not recommend fasting or intense exercise adjustments that could cause hypoglycaemia without medical review.
- **Not a medical device:** state this clearly; no diagnosis.
- **LLM never sets numbers:** calories, floors, and exercise minutes come from deterministic code. The LLM only explains and chats.
- **Red-flag symptoms** (chest pain, fainting, severe dizziness) trigger a stop-and-seek-care message.

---

## 6. Feature checklist

**Priority tags**

- **[P0]** must work in the live demo.
- **[P1]** strong differentiator; build if time allows.
- **[P2]** stretch or roadmap slide.

Tick boxes as you go.

### A. Onboarding and profile

- [ ] **[P0]** Bangla and English UI toggle; Bangla numerals option.
- [ ] **[P0]** Profile: age, sex, height, weight, activity level, goal (lose, maintain, gain, build muscle), pace.
- [ ] **[P0]** **Asian-adjusted BMI** (23 / 27.5) with a simple explanation, plus **waist circumference** and waist-to-height ratio.
- [ ] **[P0]** Safety screening questions (Section 5.5) with branching: high-risk users get a restricted, doctor-first mode.
- [ ] **[P1]** Eating style: rice-heavy, roti-heavy, vegetarian, no-beef, halal-only, fasting habits.
- [ ] **[P1]** Budget band in taka per day for food.
- [ ] **[P1]** Household profile: who cooks, how many eat from the pot, meals eaten out per week.
- [ ] **[P1]** Daily routine: work hours, prayer times, commute type (walk, rickshaw, bus, CNG, bike).
- [ ] **[P2]** Optional family accounts with consent (parent sees a child's summary, caregiver mode for elders).

### B. Food logging (the daily habit)

- [ ] **[P0]** **Bangla and Banglish text logging**: "dupure bhat, dal, alu bhorta, mach" → structured items with portions.
- [ ] **[P0]** **Photo logging with segmentation** (FoodBD-style) that lists each item, shows confidence, and lets the user fix items and portions in one tap.
- [ ] **[P0]** **Deshi food database** with Bangla name, English name, aliases, common spellings, and region tags.
- [ ] **[P0]** **Household measures**: bati (small, medium, large), serving spoon, tea spoon, glass, cup, piece, ladle, hand portion, and **plate fraction** (quarter, half, full) with a reference plate size.
- [ ] **[P0]** Recents, favourites, "same as yesterday", and copy meal.
- [ ] **[P1]** **Bangla voice logging** (speech-to-text for Bangla, then the same parser).
- [ ] **[P1]** **Rice calibrator**: pick your usual plate and bowl, show a photo of rice at 100 / 150 / 200 / 300 g cooked, save "my usual rice portion". Highest accuracy gain per effort. [Design]
- [ ] **[P1]** **Rice type** hints (miniket, nazirshail, parboiled, atop, brown, polao rice) with glycaemic hints from local GI data.
- [ ] **[P1]** **Home-cooked recipe builder**: enter ingredients, oil, number of servings; the app computes per-serving values and stores "Amma's dal". Include cooking-method and oil-absorption options.
- [ ] **[P1]** **Shared-pot mode**: "I ate about 1/5 of the pot" or "2 spoons from the family pot".
- [ ] **[P1]** Street food and snacks presets (fuchka, chotpoti, singara, samosa, jhalmuri, bhaja-puri, tea with sugar and milk, beguni, piyaju).
- [ ] **[P1]** Restaurant and delivery items (biriyani, tehari, kacchi, burger chains, local sweet shops) with ranges.
- [ ] **[P1]** Barcode scan for packaged local brands (starts as a crowd-built database).
- [ ] **[P2]** Messenger or Telegram bot logging for people who do not want another app (Facebook-style messaging is heavily used in Bangladesh; verify current figures before claiming). [Design]
- [ ] **[P2]** Receipt or delivery-app screenshot import.

### C. Calorie, macro and nutrient tracking

- [ ] **[P0]** Daily and weekly calories, protein, carbohydrate, fat, fibre.
- [ ] **[P0]** **Plate-balance view** using the Bangladeshi healthy-plate guidance (portion of rice, vegetables, protein) rather than only numbers.
- [ ] **[P1]** Micronutrients most relevant locally (iron, vitamin A, calcium, zinc, vitamin D, B12), shown with a **confidence range** because Bangladeshi tables disagree for some nutrients.
- [ ] **[P1]** Sodium and oil awareness (salt, achar, dried fish, fried items). [Design; verify numbers before display]
- [ ] **[P1]** Sugar from tea, sweets, soft drinks, and juice, shown as spoons of sugar.
- [ ] **[P1]** Glycaemic load estimate for common meals, with "swap" suggestions.
- [ ] **[P1]** Water intake with heat-adjusted reminders.
- [ ] **[P2]** Dietary diversity score (food groups per day) to flag protein or vegetable gaps.

### D. Exercise and activity

- [ ] **[P0]** Activity logging with MET-based energy for walking, jogging, cycling, cricket, football, badminton, swimming, yoga, home bodyweight work, household chores, and prayer-related movement (kept respectful and optional).
- [ ] **[P0]** **Step and activity import** from the phone (health APIs) without needing a watch.
- [ ] **[P0]** Net-calorie logic (subtract resting energy) so the app does not over-credit exercise.
- [ ] **[P1]** **No-equipment and small-space plans**: rooftop, balcony, and room workouts; low-noise options for apartments.
- [ ] **[P1]** **Context-aware suggestions**: heat index, rain, **air quality**, load-shedding (fan/AC off), and daylight. If AQI is poor or it is very hot, switch to indoor options.
- [ ] **[P1]** **Prayer-time and Ramadan-aware scheduling**: suggest slots after fajr, between prayers, or after iftar.
- [ ] **[P1]** Women-friendly privacy mode: home-only plans, no public leaderboard by default, modest-wear-friendly options.
- [ ] **[P1]** Beginner progression (10-minute walks to 30 minutes) and physical-activity-pyramid guidance from the national guidelines.
- [ ] **[P2]** Gym-light strength plans with resistance bands.
- [ ] **[P2]** Exercise safety: warm-up, heart-rate caution, and "stop if" warnings.

### E. Calorie balance engine (headline feature)

- [ ] **[P0]** 7-day rolling energy budget (Section 5.2).
- [ ] **[P0]** **Overshoot detection** with a gentle, shame-free message.
- [ ] **[P0]** **Spread plan for the next 3 to 7 days** with both intake trims and exercise minutes, each shown with the maths and ±range.
- [ ] **[P0]** User controls: choose window length, 60/40 split, exercise types they like, days they cannot train.
- [ ] **[P0]** Hard safety floors and caps (Section 5.2 and 5.5).
- [ ] **[P1]** **"Planned feast" mode** for Eid, weddings, and gatherings: a small pre-bank and an after-event recovery plan.
- [ ] **[P1]** **Adaptive TDEE** with an honest confidence indicator (Section 5.3).
- [ ] **[P1]** "What if?" simulator: "If I eat this biriyani now, what changes this week?" before the user eats.
- [ ] **[P1]** **Reverse mode**: "I want to eat X on Friday. Show me a plan for Tuesday to Thursday."
- [ ] **[P2]** Weight-trend chart with noise smoothing and notes (Eid, illness, travel, cycle).

### F. AI coach (RAG-powered)

- [ ] **[P0]** Chat in Bangla, English, and Banglish.
- [ ] **[P0]** **Grounded answers with citations** to the retrieved source (FCTB row, dietary-guideline section) so judges see it is not hallucinating.
- [ ] **[P0]** **Deterministic numbers**: the LLM calls tools for calories and exercise; it never invents them.
- [ ] **[P0]** Refusal and redirect rules for medical, drug, and extreme-diet questions.
- [ ] **[P1]** **Meal suggestions that fit the remaining budget, the user's cost band, and what is in season** (for example hilsa season, winter vegetables, mango season).
- [ ] **[P1]** **Smart swaps**: "less rice, more dal and vegetables", "bake or air-fry instead of deep-fry", "tea with less sugar", with local alternatives.
- [ ] **[P1]** **Cheap-protein finder**: protein per taka using current bazar prices (egg, dal, small fish, soybean, chicken).
- [ ] **[P1]** Explain "why" for every suggestion in one sentence.
- [ ] **[P1]** Weekly review: what went well, one thing to try, no scolding.
- [ ] **[P2]** Proactive nudges timed to the user's routine (not spam).
- [ ] **[P2]** Voice reply in Bangla.

### G. Personalisation that current apps do not serve

These are your "why us" slides.

- [ ] **[P0]** **Deshi-first food intelligence**: dishes, spellings, regional variants, and cooking styles recognised without the user searching a Western database.
- [ ] **[P1]** **Regional variants**: the same dish varies by region (Dhaka, Sylhet, Chattogram, Barishal, Rajshahi, Rangpur); let the user pick a home region that tunes defaults.
- [ ] **[P1]** **Plate and bowl personalisation**: user photographs their own plate and bati once; portion estimates use those as references.
- [ ] **[P1]** **Ramadan mode**: iftar and sehri plans, hydration schedule, light-exercise timing, and no deficit pressure during fasting unless the user opts in.
- [ ] **[P1]** **Taka-aware planner**: weekly meal plan inside a budget with a shopping list.
- [ ] **[P1]** **Family and caregiver mode**: plan one family menu that works for the user's goal and also for others (children, elders, a family member with diabetes).
- [ ] **[P1]** **Seasonal and festival calendar**: pitha season, Eid foods, Pohela Boishakh panta-ilish, Durga Puja and other community festivals, with respectful, non-judgemental guidance.
- [ ] **[P1]** **Condition-aware modes** (only with safety gates and medical disclaimer): diabetes-friendly and hypertension-friendly plates using the national guidelines' disease sections.
- [ ] **[P2]** **Para/office/university challenges** with team goals instead of individual weight competition.
- [ ] **[P2]** **Dietitian handoff**: export a weekly summary PDF to share with a nutritionist or doctor.
- [ ] **[P2]** **Lab-report OCR** (blood sugar, lipid) in Bangla and English that adjusts advice with consent.
- [ ] **[P2]** **Community-contributed recipes**, moderated and nutritionist-verified.

### H. Habits, motivation and UX

- [ ] **[P0]** Fast home screen: today's calories, rice portion, plate balance, one next action.
- [ ] **[P0]** Non-judgemental language everywhere; no red "over" labels.
- [ ] **[P1]** Streaks that forgive ("5 of last 7 days" instead of "streak lost").
- [ ] **[P1]** Home-screen widget and quick-log notification.
- [ ] **[P1]** Dark mode and large-text accessibility; low-literacy mode with icons and voice.
- [ ] **[P2]** Light gamification: badges for balanced plates and vegetable variety, not for extreme restriction.

### I. Offline, performance and cost

- [ ] **[P0]** **Offline-first core**: logging, food database, and the balance engine work without internet.
- [ ] **[P0]** Small APK and low-RAM friendly; tested on a low-end Android phone.
- [ ] **[P1]** **On-device photo model** (quantised) for common foods; cloud fallback for hard cases.
- [ ] **[P1]** Sync when online, with conflict-safe merging.
- [ ] **[P1]** Data-saver mode: compress images, defer uploads to Wi-Fi.
- [ ] **[P2]** Mobile-financial-service payment for a premium tier (optional; check provider integration requirements first).

### J. Privacy, safety and trust

- [ ] **[P0]** Clear consent, data-minimisation, and delete-my-data.
- [ ] **[P0]** Health-data encryption at rest and in transit.
- [ ] **[P0]** Visible medical disclaimer and safety screening (Section 5.5).
- [ ] **[P1]** Local-first storage option (data stays on device unless the user opts in).
- [ ] **[P1]** Audit log for AI suggestions (what was retrieved and why).
- [ ] **[P1]** Content review by a registered nutritionist for the seed database and rules.
- [ ] **[P2]** Bias check across age groups, sexes, and body types.

### K. Admin and data operations (shows engineering maturity)

- [ ] **[P1]** Admin panel to add or edit foods, recipes, and prices.
- [ ] **[P1]** "Report wrong calories" button feeding a review queue.
- [ ] **[P1]** Source tags on every food row (measured, FCTB, borrowed from another table, user-submitted, estimated).
- [ ] **[P2]** Analytics dashboard: most-logged foods, missing foods, regional trends (anonymised).

---

## 7. RAG and AI architecture

### 7.1 Principle: structured data for numbers, RAG for knowledge, LLM for language

| Layer | Used for | Notes |
|---|---|---|
| **Structured food DB** (SQL) | Calories, macros, micronutrients, household measures, prices, aliases | Single source of truth. Every row has a source tag. |
| **Deterministic engine** | BMR/TDEE, MET exercise energy, budget banking, safety floors | Unit-tested. No LLM involved. |
| **Vector store (RAG)** | National dietary guidelines text, FCTB notes, cooking and portion guidance, exercise guidance, your curated FAQs | Used for explanations and advice, with citations. |
| **LLM** | Understand Bangla/Banglish input, call tools, write friendly explanations | Tool-calling only for numbers. |
| **Vision model** | Segment and classify foods in photos | Starts from FoodBD, BD-Food33, DeshiFoodBD, rice datasets, plus your own photos. |

### 7.2 RAG corpus plan

1. *National Dietary Guidelines for Bangladesh* (2025): chunk by section and keep table rows (exchange lists, weights and measures) as structured records.
2. FCTB 2013 documentation and notes (not only the numbers).
3. Asian BMI and obesity guidance.
4. Physical activity guidance and Compendium notes.
5. Your own curated "deshi swaps" and cooking-method notes, reviewed by a nutritionist.
6. Seasonal and price notes you collect.

**Chunking:** by heading, 300 to 600 tokens, with metadata (source, section, language, date). Keep Bangla and English chunks side by side where the source has both.

**Embeddings:** use a **multilingual** embedding model that handles Bangla well, and test it on your own Bangla queries before committing. (I did not benchmark models, so run a quick retrieval test with 30 Bangla and Banglish questions.)

**Retrieval:** hybrid search (keyword plus vector), because food names have many spellings. Add a **transliteration and alias layer** so "bhorta", "vorta", "ভর্তা" all match.

**Answer format:** short answer, then "Source: section name". Refuse if retrieval confidence is low.

### 7.3 Food-name parsing pipeline

1. Normalise text (Bangla digits, spelling variants, Banglish).
2. Extract items and quantities ("2 ruti", "ek bati dal", "half plate bhat").
3. Match to DB rows with fuzzy search and aliases.
4. Ask **one** clarifying question only when needed (for example "fried or curry fish?").
5. Convert household measures to grams using stored conversions.
6. Show an editable result.

### 7.4 Photo pipeline

1. Segment items on the plate.
2. Classify each item (restrict to your supported food list first).
3. Estimate portion using plate or bowl references (user's calibrated plate if available).
4. Map to DB rows, compute totals with a range, then ask the user to confirm or edit.
5. Save corrections as training data (with consent).

### 7.5 Guardrails

- System rules: never give a diagnosis, never prescribe medication, never recommend extreme restriction, always follow the safety gates.
- Output checks: numbers in the answer must match tool outputs; block answers that contain unsourced numbers.
- Red-team prompts: crash diets, fasting for fast weight loss, diabetes medication questions, eating-disorder language, "burn off a binge". The correct behaviour is a calm refusal, a safer alternative, and a referral.

---

## 8. Evaluation: how to prove it works

Judges love numbers. Build a small, honest evaluation.

| What to measure | How | Target to aim for |
|---|---|---|
| **Calorie error on weighed meals** | 50 to 100 home-style Bangladeshi plates, weighed ingredients, compared with the app's output (text and photo) | Report mean absolute percentage error and show it beating a generic global app on the same plates. Do not promise a number before you measure it. |
| **Food-name parsing accuracy** | 200 Bangla, English and Banglish log lines | Report correct-item and correct-portion rates. |
| **RAG quality** | 50 questions from the dietary guidelines, scored for correct source and faithful answer | Report retrieval hit rate and groundedness. |
| **Safety behaviour** | 30 red-team prompts | Report pass rate and show two failure fixes. |
| **Rebalancing sanity** | Simulated users with overshoots | Show no plan violates the floor or caps. |
| **Usability** | 5 to 10 real users logging a day of meals | Report average logging time per meal. |

Also state the **limits** you found (mixed dishes, street food, portion error). Honest limits make you more credible, not less.

---

## 9. Demo script and judging map

### 9.1 Three-minute demo flow

1. **Problem (20s):** global apps do not know shorshe ilish, bhorta, or a family pot of dal, and they punish an over-day.
2. **Onboarding (20s):** Bangla UI, Asian BMI, safety screen.
3. **Log a real meal (40s):** take a photo of a rice plate; the app segments rice, dal, bhorta, fish; user taps to correct portion using their own plate calibration.
4. **Voice or Banglish log (15s):** "rate e ek plate biriyani ar ek glass borhani".
5. **Overshoot (40s):** show the overshoot, then the **4-day gentle plan** with minutes and the ±range. Toggle the 60/40 split live.
6. **AI coach with citations (25s):** ask "diabetes thakle bhat koto khabo?"; show the grounded answer, the source, and the safe referral.
7. **Offline proof (10s):** airplane mode; logging and plan still work.
8. **Impact and roadmap (20s):** diabetes burden, rice dominance, dataset moat, dietitian handoff.

### 9.2 Typical judging criteria and how to answer them

(Check your hackathon's own rubric; this is the usual shape.)

| Criterion | Your answer |
|---|---|
| **Innovation** | Rebalance-over-days engine, rice calibrator, Bangla-first RAG with citations, taka-aware planning. |
| **Impact** | Diabetes and rice-centred diet context; an official-guideline-grounded coach. |
| **Technical depth** | Hybrid RAG, deterministic engine plus LLM tool-calling, segmentation model, offline-first. |
| **Feasibility** | Free FCTB and national guidelines, public image datasets, working prototype. |
| **Responsible AI** | Safety gates, no-LLM-numbers rule, red-team results. |
| **UX** | Bangla voice and photo logging, shame-free tone. |
| **Business** | Freemium; dietitian marketplace; corporate wellness; telecom bundle. (Validate before claiming.) |

---

## 10. Risks and build plan

### 10.1 Risks and mitigations

| Risk | Mitigation |
|---|---|
| Food tables disagree or have missing nutrients | Show ranges; tag source per row; prioritise calories and macros. |
| Photo model fails on mixed or unusual dishes | Limit to supported foods, always allow edits, show confidence. |
| Calorie plans push vulnerable users toward harm | Safety gates, caps, no 100% compensation, no punishment language, referral paths. |
| Dataset licences restrict commercial use | Check licences; keep a "prototype only" note; collect your own data. |
| LLM hallucinated numbers | Tool-calling for all numbers; output validator. |
| Bangla speech and text quality | Test with real users; keep editable results. |
| Over-claiming accuracy | Publish your own measured numbers only. |
| Privacy of health data | Consent, encryption, local-first option, delete button. |

### 10.2 Suggested build order (adapt to your hackathon length)

**First third: core that must demo**

1. Food DB with 300 to 500 deshi items, aliases, household measures.
2. Text and Banglish logging parser.
3. BMR/TDEE, MET engine, safety gates.
4. Rebalancing engine and UI.

**Second third: differentiators**

5. Photo logging on FoodBD-based model with edit flow.
6. RAG over the dietary guidelines with citations.
7. Rice calibrator and plate-balance view.
8. Offline mode.

**Final third: polish and proof**

9. Evaluation set and numbers.
10. Red-team the AI coach.
11. Demo data, demo video backup, and slides.
12. Roadmap slide (Ramadan mode, family mode, dietitian handoff).

**If you are short on time, cut in this order:** Messenger bot, lab OCR, challenges, gamification. **Never cut:** safety gates, citations, and the rebalancing engine.

---

## 11. Sources

**Global tracker landscape**
- Fitia, "Best food tracking app in the US (2026)", comparison of Fitia, MyFitnessPal, Cronometer, Lose It!, MacroFactor: https://fitia.app/en/learn/article/best-food-tracking-app-us-2026-comparison/ *(competitor-published)*
- Fitia, "8 best apps for tracking daily calorie intake in 2026": https://fitia.app/learn/article/best-daily-calorie-tracking-apps-2026/ *(competitor-published)*
- Fitia, "How accurate are apps that calculate calories from photos?": https://fitia.app/learn/article/ai-calorie-photo-apps-accuracy-2026/ *(competitor-published)*
- Amy Food Journal, best calorie tracker and AI counter reviews: https://www.amyfoodjournal.com/blog/best-calorie-tracker-app and https://www.amyfoodjournal.com/blog/ai-calorie-counter-apps *(competitor-published)*
- MacroFactor, algorithm explanation: https://macrofactor.com/algorithm-accuracy/
- MacroFactor review and pricing summaries: https://amyfoodjournal.com/blog/macrofactor-review and https://gainframe.app/blog/macrofactor-review/ *(secondary)*
- SnapCalorie (App Store and TechCrunch coverage): https://apps.apple.com/us/app/-/id1574239307 and https://techcrunch.com/?p=2561037
- Nutrola, "Why calorie trackers recommend 1,200 calories": https://nutrola.app/en/blog/why-calorie-trackers-recommend-1200-calories-and-why-its-dangerous *(competitor-published)*

**India and Bangladesh app landscape**
- HealthifyMe coverage: https://yourstory.com/companies/healthifyme, https://ca.news.yahoo.com/khosla-backed-healtifyme-introduces-ai-100012355.html, https://nutriscan.app/blog/posts/healthifyme-worth-it-2026-ria-ai-indian-food-tracker-f3167114ef *(partly vendor or reseller claims)*
- Nutrimate India comparison: https://nutrimate-dwcacsfva4cgcwer.centralindia-01.azurewebsites.net/?p=919 *(self-published)*
- Google Play top health apps in Bangladesh: https://42matters.com/top-charts-explorer/android/bangladesh/health-fitness
- Deshi Diet Plan: https://www.producthunt.com/products/deshi-diet-plan/launches
- Open-source Bangla fitness calculator: https://github.com/mnislam01/FitApp
- AjkerMenu: https://apps.apple.com/kw/app/ajkermenu/id6503480418
- Dhaka Tribune, "2 apps to beat the battle of the bulge": https://www.dhakatribune.com/feature/tech/110352/2-apps-to-beat-the-battle-of-the-bulge

**Food composition and guidelines**
- FAO entry, Food Composition Table for Bangladesh (2013): https://www.fao.org/food-composition/tables-and-databases/detail/(country--date)-title-1/en
- FCTB PDF (FAO): https://www.fao.org/fileadmin/templates/food_composition/documents/FCT_10_2_14_final_version.pdf
- FCTB database spreadsheet (FAO): https://www.fao.org/fileadmin/templates/food_composition/documents/FCDB_7_4_14.xlsx
- Ali and Amin 2020, divergence between the two Bangladeshi FCTs: https://rcastoragev2.blob.core.windows.net/91d5fc9e41682a012b054e2b7dd51e0c/PMC7752119.pdf
- Mondol and Rahim 2025, standardised home-cooked recipes: https://banglajol.info/index.php/BRC/article/download/86760/56313/239583
- National Dietary Guidelines for Bangladesh (WHO SEARO PDF; August 2025 edition): https://cdn.who.int/media/docs/default-source/searo/bangladesh/national-dietary-guidelines-for-bangladesh.pdf
- FAO page on earlier Bangladesh guidelines: https://www.fao.org/nutrition/education-nutritionnelle/food-dietary-guidelines/regions/bangladesh/fr/

**Image datasets**
- FoodBD: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12801922/
- BD-Food33: https://data.mendeley.com/datasets/8wt48bjmx3/1
- DeshiFoodBD: https://data.mendeley.com/datasets/tczzndbprx
- Aruzz22.5K rice varieties: https://data.mendeley.com/datasets/3mn9843tz2
- DIU CNN paper on traditional foods: https://research.daffodilvarsity.edu.bd/scopus-article/207

**Health context**
- Bonik Barta on IDF 2024 diabetes figures: https://en.bonikbarta.com/bangladesh/twYysBEZQnbWQX4Y/
- BMJ Open 2022, diabetes prevalence change in Bangladesh: https://doaj.org/article/8e198d36e45743278149dd940ebe813f
- Asian BMI cut-offs (WHO 2004 as summarised): https://nationalacademies.org/event/10-09-2018/docs/DE6666BEA0C67BF14C6E3FD24C0BC961C8FF1D11F4EF?noSaveAs=1 and https://pmc.ncbi.nlm.nih.gov/articles/PMC3868582
- UK study on South Asian dysglycaemia at lower BMI: https://www.pulsetoday.co.uk/?p=16261
- White rice and diabetes, 21-country study coverage: https://www.thequint.com/fit/diabetes/white-rice-linked-to-diabetes-finds-a-21-nation-study
- Glycaemic index of Bangladeshi rice varieties: https://core.ac.uk/download/389318509.pdf

**Exercise energy and safe rates**
- MET formula and Compendium summaries: https://ajdesigner.com/calories-burned/ and https://www.bodyspec.com/blog/post/calories_burned_calculator_for_150_activities *(secondary)*
- Safe rate-of-loss and deficit guidance: https://fitia.app/learn/article/how-many-calories-should-i-eat-to-lose-weight/ and https://ro.co/weight-loss/calorie-deficit/ *(secondary)*

**Connectivity**
- BTRC figures via The Financial Express: https://thefinancialexpress.com.bd/trade/internet-subscriber-growth-outpaces-mobile-connections-in-h1
- DataReportal-based offline figure and speeds: https://dailynewnation.com/news/828740
- GSMA findings via TBS: https://www.tbsnews.net/node/1013061

---

## Appendix: ten one-line pitches (pick one)

1. "The first calorie coach that understands bhat, dal, and the family pot."
2. "Ate too much at the wedding? We spread the fix over four easy days, not one guilty one."
3. "Bangla-speaking AI dietitian grounded in Bangladesh's own dietary guidelines."
4. "Rice is 80% of the plate; we measure it properly."
5. "Healthy eating in taka, not dollars."
6. "Works offline, on a low-end phone, in Bangla."
7. "Asian-adjusted health risk, not Western BMI."
8. "Shame-free tracking: forgiving streaks, safe floors, no punishment exercise."
9. "Every AI answer cites the guideline it came from."
10. "From Ramadan to Eid to pitha season: a health companion that follows the Bangladeshi calendar."
