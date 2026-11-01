# Dataset Inventory & Provenance

**Project:** Deshi Health Companion (HabitForge)
**Last Updated:** November 2, 2026

All source datasets required by the research (`docs/bangladeshi-calorie-companion-research.md`) and implementation plan (`docs/IMPLEMENTATION_PLAN.md`) have been fetched, verified, and placed under `/media/moballig/exprement/YUNet AIgnite Buildathon/habitforge/data/`.

---

## 1. Downloaded Datasets & Source Documents

| File | Size | Source / Agency | Description | Implementation Usage |
|---|---|---|---|---|
| **`FCDB_7_4_14.xlsx`** | 757 KB | FAO & INFS, University of Dhaka | Official Food Composition Table for Bangladesh (FCTB 2013) Database Spreadsheet. Contains 1,058 rows covering 381 national foods across cereals, fish, vegetables, pulses, and sweets. | Primary baseline for authentic macro and micronutrients. Seed data for Convex `foods` table. |
| **`FCT_10_2_14_final_version.pdf`** | 5.3 MB | FAO & INFS, University of Dhaka | Complete FCTB 2013 Reference Publication containing analytical methods, retention/yield factors for cooking, and ethnic food notes. | Cooking yield factors and nutrient retention calculation for cooked recipes. |
| **`national-dietary-guidelines-for-bangladesh.pdf`** | 11 MB | WHO SEARO & National Nutrition Services (Aug 2025) | Official *National Dietary Guidelines for Bangladesh*. Includes food plate, physical activity pyramid, standardised weights/measures, food exchange lists, and disease guidance. | RAG Knowledge Corpus for AI Dietitian grounding, plate calibration rules, and lifestyle recommendations. |
| **`mondol-rahim-2025-standardised-recipes.pdf`** | 907 KB | Bangladesh Research Communications (2025) | Lab-tested nutrient analysis of standardised home-cooked Bangladeshi recipes (vegetable, fish, festival curries) with cooking oil retention data. | Recipe calculator engine and home-cooked dish presets (dal, bhorta, curries). |
| **`rice-glycaemic-index-bau.pdf`** | 5.3 KB | Bangladesh Agricultural University (BAU) | Glycaemic index (GI) and load measurements for 6 major commercial Bangladeshi rice varieties (Miniket, Nazirshail, BR-28, Atop, Parboiled). | Rice calibrator hints and diabetic-safe carbohydrate coaching. |

---

## 2. Processed & Machine-Readable Datasets

| File | Count | Format | Description |
|---|---|---|---|
| **`fctb_foods_extracted.json`** | 381 items | JSON | Full structured extraction of `FCDB_7_4_14.xlsx`. Includes English & Bengali names, Scientific names, energy (kcal), water, protein, fat, available carbohydrates, dietary fiber, calcium, iron, magnesium, phosphorus, potassium, sodium, zinc, and vitamins A & C. |

---

## 3. Public Benchmark & Model Datasets Referenced (Online APIs / Hubs)

These vision and classification datasets are cataloged for photo-recognition and evaluation benchmarks in Wave 2 / Wave 8:

1. **FoodBD (Dec 2025):** 3,523 smartphone meal images, 67 Bangladeshi classes, polygon segmentation (12,575 annotations) with Bangladesh standard serving nutrition labels. (`PMC12801922`)
2. **BD-Food33:** Mendeley Data (DIU, Dec 2025), 1,200+ images, 33 local food categories.
3. **DeshiFoodBD:** Mendeley Data (2021), 5,425 labelled images, 19 Bangladeshi festival & restaurant foods.
4. **Aruzz22.5K:** Jahangirnagar University rice variety dataset (4,730 original images across 20 rice varieties).

