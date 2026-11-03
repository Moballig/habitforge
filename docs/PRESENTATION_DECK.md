# 🎯 Ostad Presents YUNet AIgnite Buildathon 2026
## 5-Slide Official Presentation Deck: Deshi Health Companion

**Product:** Deshi Health Companion (বাংলাদেশি পুষ্টি ও স্বাস্থ্য সঙ্গী)  
**Track:** B2C Lifestyle & Health AI Product  
**Author:** Solo Student Participant  
**Live App:** Production-ready on Next.js + Bun + Convex  
**Repository:** `habitforge/`

---

### Slide 1: Problem Statement — The Bangladesh Nutritional Crisis
- **The Asian BMI Paradox:** South Asians and Bangladeshis develop Type 2 diabetes, insulin resistance, and visceral cardiovascular complications at a BMI as low as **23.0** (vs Western WHO cut-off of 25.0).
- **Rice Monoculture:** According to BBS HIES & INFS Dhaka University, rice supplies over **65% of daily calories** in Bangladeshi diets, leading to severe postprandial glucose surges.
- **Shared Pots & Local Household Measures:** Bangladeshi families cook in shared pots (*deg/karai*), eating with hands using household utensils (*bati*, *chamoch*, *hata*). Western gram-counter apps (MyFitnessPal, LoseIt) fail completely in Bangladesh.
- **The Deficit Shame Spiral:** Western apps demand immediate punitive 500–1000 kcal deficits after a feast day (e.g. Friday wedding biriyani), triggering metabolic slowdown and abandonment.

---

### Slide 2: The Solution — Deshi Health Companion
- **Bangladesh-First Calorie & Habit Balancing:** The first evidence-based, culturally native health companion built specifically for the Bangladeshi lifestyle.
- **Deterministic 7-Day Rebalancing Engine:** Never punishes a single feast day. Spreads caloric recovery smoothly over 3–7 days (recovering 50–70% of surplus, capping daily trims, and strictly enforcing the BMR metabolic safety floor).
- **Bilingual & Banglish AI Logging:** Type in Bengali ("ভাত, মসুর ডাল আর ডিম ভাজি"), English, or Banglish ("dupure 1 bati bhat ar rui mach").
- **Assisted Plate Vision & Shared-Pot Math:** Snap a photo of a lunch thali for instant segment recognition or enter the shared pot fraction (e.g. 1/5th of a 1 kg dal pot).

---

### Slide 3: System Architecture & Technical Depth
```
   ┌─────────────────────────────────────────────────────────────┐
   │        Client UI: Next.js 16 (App Router) + Bun + PWA       │
   │  Bilingual (EN/BN) · Offline FCTB Search · Tailwind CSS v4  │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Reactive Sync / Mutations
   ┌──────────────────────────────▼──────────────────────────────┐
   │            Convex Cloud Serverless Backend                  │
   │   Profile · Meal Logs · Weigh-ins · Weather Cache · Budget  │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌─────────────────────────────────┐       ┌────────────────────────────────┐
│   Pure Deterministic Engine     │       │    Verified Local RAG System   │
│  • Asian BMI (23 / 27.5 cutoffs)│       │  • 9,447 chunks (FCTB, NNS,   │
│  • 6 Engine Safety Profiles     │       │    McGill CINE indigenous)     │
│  • 5,000-case Rebalance Fuzzer  │       │  • Xenova/multilingual-e5-small│
│  • Compendium MET Calculations  │       │  • Groq Llama 3.3 70B & Qwen   │
│  • ZERO LLM Calorie Math        │       │  • Strict Numeric Validator    │
└─────────────────────────────────┘       └────────────────────────────────┘
```
- **Safety First (Zero Math Hallucination):** Calorie budgets, BMR, TDEE, and METs are calculated strictly by pure TypeScript mathematical code—never delegated to an LLM.
- **Air Quality & Thermal Safety Guardrail:** Real-time Open-Meteo polling for Dhaka AQI and feels-like temperature. If AQI exceeds 150 or heat index exceeds 38°C, the app automatically switches outdoor walking suggestions to indoor stairs or living-room pacing.

---

### Slide 4: Key Product Features & Live Capabilities
1. **Condition-Aware Plate Presets (FR-G-01 / FR-G-02):**
   - *Diabetes & Glycemic Control Plate:* 50% non-starchy leafy greens (korola, dherosh, pui shak), 25% lean protein/dal, 25% low-GI coarse parboiled rice (lal chal) or whole-wheat ruti with BIRDEM/NNS medical disclaimers.
   - *Hypertension Sodium Watch Plate:* <5g table salt/day, strictly eliminating shutki and oil-soaked achar, prioritizing high-potassium deshi staples (green banana, green coconut, lime).
2. **Ramadan Fasting Mode & Hydration Planner (FR-G-03):**
   - Zero-deficit safety rule during fasting: blocks dangerous calorie deficits unless medically cleared.
   - 4-stage hydration pacing (9 glasses from Iftar to Sehri) to prevent heat-related dehydration.
3. **Cheap-Protein & Taka Economics (FR-G-05):**
   - Live Dhaka WFP market prices mapped to protein density (Taka per 20g protein).
   - Instant filtering for high-protein, budget-friendly staples (soybeans, masur dal, eggs, pangas fish).
4. **Offline PWA Capability:**
   - Client-side offline search across 318 Deshi foods, Service Worker asset caching, and standalone mobile installability.

---

### Slide 5: Developer Profile & Future Roadmap
- **Solo Participant:** Developed end-to-end for *Ostad Presents YUNet AIgnite Buildathon 2026*.
- **Official Compliance:** Visible "Built For Ostad Presents YUNet AIgnite Buildathon 2026" badge integrated across TopBar navigation and side navigation rails.
- **Validation:** 92 automated tests passing, 5,000-case randomized mathematical property fuzzing, and production Next.js build validated.
- **Future Roadmap:**
  - On-device offline voice logging in regional dialects (Sylheti, Chittagonian).
  - Integration with continuous glucose monitors (CGM) and bluetooth weighing scales.
  - Live DAM (Department of Agricultural Marketing) daily wholesale market API sync across all 64 districts of Bangladesh.

