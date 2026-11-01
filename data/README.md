# Dataset Inventory, Provenance & Machine-Readable Artifacts

**Project:** Deshi Health Companion (HabitForge)
**Last Updated:** November 2, 2026
**Location:** `/media/moballig/exprement/YUNet AIgnite Buildathon/habitforge/data/`

All datasets listed in the user's research index and project requirements have been audited, downloaded where open and accessible, parsed into structured machine-readable formats (JSON & CSV), and indexed for the nutrition engine, AI dietitian RAG, and price estimation.

---

## 1. Food Composition Tables & Nutrient Databases

| Dataset / File | Records | Format | Source | Description & Application |
|---|---|---|---|---|
| **`FCDB_7_4_14.xlsx`** | 1,058 rows | XLSX | INFS, University of Dhaka / FAO | Official Food Composition Table for Bangladesh (FCTB 2013). |
| **`fctb_foods_extracted.json`** | 381 foods | JSON | Extracted from `FCDB_7_4_14.xlsx` | Clean, standardized extraction with English & Bengali names, Scientific names, kcal, water, protein, fat, carbohydrates, dietary fiber, and micronutrients (Ca, Fe, Mg, P, K, Na, Zn, Vit A, Vit C). |
| **`FCT_10_2_14_final_version.pdf`** | 5.3 MB | PDF | INFS / FAO | Full reference book detailing yield factors, retention factors during cooking, and sampling methodologies. |
| **`IFCT2017.pdf`** | 12 MB | PDF | National Institute of Nutrition (NIN), Hyderabad | Official Indian Food Composition Tables 2017 covering 528 key foods with 151 nutrient parameters. |
| **`ifct2017/package/`** | 542 foods | CSVs | Unpacked from official npm tarball `ifct2017@2.1.2` | Full tabular datasets including `compositions/index.csv`, `descriptions/index.csv`, `energies/index.csv`, `retentionfactors/index.csv`, and `yieldfactors/index.csv`. |
| **`ifct2017_extracted.json`** | 542 foods | JSON | Extracted from `ifct2017/` | Standardized JSON with Bengali alias matching (`B. <name>`), kcal, macros, and minerals. |
| **`cine_indigenous/`** | 153 indigenous foods | 5 PDFs | McGill CINE / UBINIG | Traditional and indigenous food composition tables from the Nayakrishi & Mog communities (Cox's Bazar, Bangladesh), analyzed by INFS, Dhaka University: Vegetables & Shak, Fruits, Cereals/Grains/Pulses, Meats/Dairy, and Fish/Seafood. |
| **`bangladesh_food_composition_kaggle_clean.csv`** | 65 KB | CSV | Kaggle / INFS | Clean tabular mirror of Bangladeshi raw ingredients. |
| **`unified_food_database.json`** | **913 foods** | JSON | FCTB 2013 + IFCT 2017 | **Unified master food database** merging national FCTB with regional Bengali-adjacent IFCT items, deduplicated with provenance tags (`fctb` vs. `regional-table`). |

---

## 2. Recipes & Cooked Dishes

| Dataset / File | Records | Format | Source | Description & Application |
|---|---|---|---|---|
| **`Cleaned_Indian_Food_Dataset.csv`** | ~6,000+ recipes | CSV (12 MB) | Kaggle / Archana's Kitchen / GitHub | Complete recipe database containing translated names, preparation time, cuisine, instructions, and comma-separated cleaned ingredients. Over 1,300 recipes match Bengali and regional fish, curry, bhaja, and dal preparations. |
| **`mondol-rahim-2025-standardised-recipes.pdf`** | 907 KB | PDF | Bangladesh Research Communications (2025) | Lab-tested nutritional composition of standardised home-cooked Bangladeshi vegetable, fish, and festival dishes with cooking oil retention data. |
| **`rice-glycaemic-index-bau.pdf`** | 5.3 KB | PDF | Bangladesh Agricultural University | Glycaemic index and load values for 6 major commercial Bangladeshi rice varieties (Miniket, Nazirshail, BR-28, Atop, Parboiled). |

---

## 3. Market Food Prices & Affordability

| Dataset / File | Records | Format | Source | Description & Application |
|---|---|---|---|---|
| **`wfp_food_prices_bgd.csv`** | 34,493 rows | CSV (4.4 MB) | WFP / Humanitarian Data Exchange (HDX) | Long-term monthly market price time series for essential food items across Bangladesh divisions and markets. |
| **`wfp_markets_bgd.csv`** | 9.3 KB | CSV | WFP / HDX | Geographic coordinates and market metadata for Bangladesh trading centers. |
| **`wfp_latest_commodity_prices.json`** | 51 commodities | JSON | Processed from WFP HDX | Latest retail price snapshot in BDT per KG / unit for rice, pulses, cooking oils, poultry, vegetables, and staples for cost-per-calorie calculations. |
| **`bgd_faostat_cost_affordability_healthy_diet.csv`** | 7.7 KB | CSV | FAOSTAT / HDX | Cost and affordability metrics of a healthy diet in Bangladesh. |
| **`bgd_faostat_food_balances.csv`** | 2.9 MB | CSV | FAOSTAT / HDX | Food balance sheets showing national supply, consumption, and macro trends. |
| **`bgd_faostat_food_security_indicators.csv`** | 207 KB | CSV | FAOSTAT / HDX | National nutritional and caloric intake indicators. |

---

## 4. Dietary Guidelines & Health Knowledge (RAG Corpus)

| Document | Format | Source | Description & Application |
|---|---|---|---|
| **`national-dietary-guidelines-for-bangladesh.pdf`** | PDF (11 MB) | WHO SEARO & National Nutrition Services (Aug 2025) | Official national guidelines containing the Bangladeshi food pyramid, healthy plate proportions, physical activity pyramid, food exchange lists, and disease guidance (diabetes, hypertension, obesity, kidney disease). Primary RAG corpus for the AI coach. |

---

## 5. Vision / Image Dataset Links & Access Notes

1. **FoodBD (Dec 2025, BMC Research Notes / UIU / BUET):**
   - Publication: [doi:10.1186/s13104-025-07583-8](https://doi.org/10.1186/s13104-025-07583-8)
   - Mendeley DOI: [10.17632/xh3ghf3jbg.2](https://doi.org/10.17632/xh3ghf3jbg.2)
   - 3,523 meal images, 67 Bangladeshi classes, polygon segmentation, and 1,837 nutritional annotations (calories, carbs, protein, fat, fiber, glycemic load).
2. **BD-Food33 (Dec 2025, Daffodil Int'l Univ.):** Mendeley `8wt48bjmx3` (1,200+ images across 33 categories).
3. **DeshiFoodBD (2021):** Mendeley `tczzndbprx` (5,425 images, 19 dishes).
4. **Bangladeshi Street Food:** Mendeley `pjkrx3kk8h` (5 Dhaka street food classes).
5. **Traditional Bangladeshi Desserts:** Mendeley `j2pnx2mwwk` (4,118 images, 27 sweet/pitha classes).
