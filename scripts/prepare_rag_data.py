#!/usr/bin/env python3
"""Extract every dataset in /data into RAG chunks + structured records.

Outputs JSONL files in scripts/out/:
  chunks.jsonl      RAG text chunks (metadata only; embeddings added by ingest_rag.mjs)
  recipes.jsonl     Cleaned_Indian_Food_Dataset.csv
  food_facts.jsonl  unified_food_database.json (FCTB + IFCT)
  prices.jsonl      wfp_food_prices_bgd.csv
  markets.jsonl     wfp_markets_bgd.csv
  indicators.jsonl  FAOSTAT food balance / security / affordability
  sources.json      dataset inventory with record + chunk counts
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "scripts" / "out"
OUT.mkdir(parents=True, exist_ok=True)

BANGLA = re.compile(r"[\u0980-\u09FF]")
WS = re.compile(r"[ \t]+")
DIGITS = re.compile(r"\d+(?:\.\d+)?")


def sha(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]


def clean(text: str) -> str:
    text = text.replace("\r", "\n").replace("\u00ad", "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = []
    for line in text.split("\n"):
        line = WS.sub(" ", line).strip()
        if not line:
            lines.append("")
            continue
        # drop bare page numbers / running headers
        if re.fullmatch(r"[\dIVXLCivxlc .-]{1,12}", line):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def lang_of(text: str) -> str:
    sample = text[:4000]
    bn = len(BANGLA.findall(sample))
    if bn == 0:
        return "en"
    letters = len(re.findall(r"[A-Za-z\u0980-\u09FF]", sample)) or 1
    return "bn" if bn / letters > 0.35 else "mixed"


def keywords_of(text: str, limit: int = 10) -> list[str]:
    words = re.findall(r"[\u0980-\u09FF]{2,}|[A-Za-z]{4,}", text)
    stop = {
        "this", "that", "with", "from", "have", "will", "your", "their", "which",
        "there", "about", "should", "would", "these", "those", "also", "than",
        "when", "what", "were", "been", "they", "into", "more", "some", "such",
        "each", "other", "food", "foods", "per", "and", "the", "for",
    }
    seen: list[str] = []
    for word in words:
        low = word.lower()
        if low in stop or low in seen:
            continue
        seen.append(low)
        if len(seen) >= limit:
            break
    return seen


def chunk_text(text: str, max_chars: int = 1400, overlap: int = 180) -> list[str]:
    text = clean(text)
    if len(text) <= max_chars:
        return [text] if len(text) >= 80 else []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            cut = text.rfind(". ", start, end)
            if cut > start + int(max_chars * 0.6):
                end = cut + 1
        piece = text[start:end].strip()
        if len(piece) >= 80:
            chunks.append(piece)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks


def pdf_pages(path: Path) -> list[str]:
    try:
        out = subprocess.run(
            ["pdftotext", "-layout", "-enc", "UTF-8", str(path), "-"],
            capture_output=True,
            check=True,
        ).stdout
    except Exception as exc:  # noqa: BLE001
        print(f"  ! pdftotext failed for {path.name}: {exc}", file=sys.stderr)
        return []
    return out.decode("utf-8", errors="replace").split("\f")


CHUNKS: list[dict] = []
SOURCES: list[dict] = []


def add_pdf(
    key: str,
    path: Path,
    source: str,
    source_tag: str,
    *,
    url: str | None = None,
    published_at: str | None = None,
    skip_pages: int = 0,
) -> int:
    pages = pdf_pages(path)
    count = 0
    for page_no, page in enumerate(pages, start=1):
        if page_no <= skip_pages:
            continue
        text = clean(page)
        if len(text) < 80:
            continue
        first_line = next((ln for ln in text.split("\n") if 3 < len(ln) < 140), "")
        for piece in chunk_text(text):
            CHUNKS.append(
                {
                    "docId": key,
                    "chunkIndex": count,
                    "sourceTag": source_tag,
                    "source": source,
                    "section": first_line[:140] or None,
                    "page": page_no,
                    "lang": lang_of(piece),
                    "text": piece,
                    "keywords": keywords_of(piece),
                    "url": url,
                    "publishedAt": published_at,
                }
            )
            count += 1
    SOURCES.append(
        {
            "key": key,
            "name": source,
            "sourceTag": source_tag,
            "url": url,
            "recordCount": len([p for p in pages if len(clean(p)) >= 80]),
            "chunkCount": count,
            "notes": f"Extracted from {path.name} with pdftotext",
        }
    )
    print(f"  {path.name}: {count} chunks", flush=True)
    return count


def jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


# ── PDF knowledge corpus ────────────────────────────────────────────────────
print("PDFs")
add_pdf(
    "ndgb-2025",
    DATA / "national-dietary-guidelines-for-bangladesh.pdf",
    "National Dietary Guidelines for Bangladesh (NNS/WHO/FAO, 2025)",
    "guideline",
    published_at="2025-08",
    skip_pages=0,
)
add_pdf(
    "fctb-2013-book",
    DATA / "FCT_10_2_14_final_version.pdf",
    "Food Composition Table for Bangladesh (INFS/FAO, 2013)",
    "food-table",
    published_at="2013",
)
add_pdf(
    "ifct-2017-book",
    DATA / "IFCT2017.pdf",
    "Indian Food Composition Tables (NIN Hyderabad, 2017)",
    "food-table",
    published_at="2017",
)
add_pdf(
    "mondol-rahim-2025",
    DATA / "mondol-rahim-2025-standardised-recipes.pdf",
    "Nutrient composition of traditional Bangladeshi curries (Mondol & Rahim, 2026)",
    "research",
    published_at="2026-01",
)
add_pdf(
    "biswas",
    DATA / "Biswas.pdf",
    "Bangladesh food composition research (Biswas)",
    "research",
)
for name, label in [
    ("Nayakrishi_Datatables_veg_leafy_veg.pdf", "Indigenous vegetables and leafy greens (Nayakrishi/CINE)"),
    ("Nayakrishi_Datatables_fruits.pdf", "Indigenous fruits (Nayakrishi/CINE)"),
    ("Nayakrishi_Datatables_cereal_grains_pulses.pdf", "Indigenous cereals, grains and pulses (Nayakrishi/CINE)"),
    ("Nayakrishi_Datatables_animals_birds_dairy.pdf", "Indigenous animals, birds and dairy (Nayakrishi/CINE)"),
    ("Nayakrishi_Datatables_fish_seafood.pdf", "Indigenous fish and seafood (Nayakrishi/CINE)"),
]:
    add_pdf(f"cine-{Path(name).stem.lower()}", DATA / "cine_indigenous" / name, label, "indigenous")

# ── Recipes ─────────────────────────────────────────────────────────────────
print("Recipes")
recipes: list[dict] = []
recipe_chunks = 0
with (DATA / "food_recipes_6000" / "Cleaned_Indian_Food_Dataset.csv").open(
    newline="", encoding="utf-8", errors="replace"
) as handle:
    for row in csv.DictReader(handle):
        name = (row.get("TranslatedRecipeName") or "").strip()
        if not name:
            continue
        ingredients = [
            part.strip()
            for part in (row.get("TranslatedIngredients") or "").split(",")
            if part.strip()
        ]
        instructions = (row.get("TranslatedInstructions") or "").strip()
        cuisine = (row.get("Cuisine") or "Unknown").strip()
        minutes_raw = (row.get("TotalTimeInMins") or "").strip()
        try:
            minutes = int(float(minutes_raw))
        except ValueError:
            minutes = None
        url = (row.get("URL") or "").strip() or None
        region = "Bengal" if "bengali" in cuisine.lower() else None
        key = sha(f"{name}|{url or cuisine}")
        recipes.append(
            {
                "key": key,
                "name": name,
                "cuisine": cuisine,
                "minutes": minutes,
                "ingredients": ingredients[:40],
                "instructions": instructions[:6000],
                "url": url,
                "source": "Cleaned Indian Food Dataset (Archana's Kitchen, via Kaggle)",
                "region": region,
            }
        )
        body = (
            f"Recipe: {name}\nCuisine: {cuisine}\n"
            f"Ingredients: {', '.join(ingredients[:30])}\n"
            f"Method: {instructions[:1100]}"
        )
        CHUNKS.append(
            {
                "docId": "recipes-corpus",
                "chunkIndex": recipe_chunks,
                "sourceTag": "recipe",
                "source": "Cleaned Indian Food Dataset (Archana's Kitchen, via Kaggle)",
                "section": name[:140],
                "lang": "en",
                "text": body,
                "keywords": keywords_of(f"{name} {cuisine} {', '.join(ingredients[:8])}"),
                "url": url,
            }
        )
        recipe_chunks += 1
jsonl(OUT / "recipes.jsonl", recipes)
SOURCES.append(
    {
        "key": "recipes-corpus",
        "name": "Cleaned Indian Food Dataset (Archana's Kitchen, via Kaggle)",
        "sourceTag": "recipe",
        "recordCount": len(recipes),
        "chunkCount": recipe_chunks,
        "notes": f"{sum(1 for r in recipes if r['region'] == 'Bengal')} Bengali recipes",
    }
)
print(f"  {len(recipes)} recipes", flush=True)

# ── Food facts ──────────────────────────────────────────────────────────────
print("Food facts")
facts: list[dict] = []
unified = json.loads((DATA / "unified_food_database.json").read_text(encoding="utf-8"))

# The FCTB extractor lost most category strings; recover them from the code prefix.
fctb_rows = json.loads((DATA / "fctb_foods_extracted.json").read_text(encoding="utf-8"))
prefix_category: dict[str, str] = {}
for row in fctb_rows:
    prefix = str(row.get("code") or "")[:2]
    category = (row.get("category") or "").strip()
    if len(category) > 3:
        prefix_category[prefix] = category
fctb_prefix_by_name = {
    row.get("nameEn"): str(row.get("code") or "")[:2] for row in fctb_rows
}


def normalise_category(item: dict) -> str:
    category = (item.get("category") or "").strip()
    if len(category) > 3:
        return category
    prefix = fctb_prefix_by_name.get(item.get("nameEn"))
    return prefix_category.get(prefix or "", "Uncategorised")
fact_chunks = 0
for item in unified:
    name_en = (item.get("nameEn") or "").strip()
    if not name_en:
        continue
    name_bn = (item.get("nameBn") or "").strip()
    key = sha(f"{name_en}|{name_bn}|{item.get('sourceTag')}")
    facts.append(
        {
            "key": key,
            "nameEn": name_en,
            "nameBn": name_bn,
            "scientificName": (item.get("scientificName") or "").strip() or None,
            "category": normalise_category(item),
            "kcalPer100": float(item.get("kcalPer100") or 0),
            "proteinPer100": float(item.get("proteinPer100") or 0),
            "fatPer100": float(item.get("fatPer100") or 0),
            "carbPer100": float(item.get("carbPer100") or 0),
            "fiberPer100": float(item.get("fiberPer100") or 0),
            "calciumMg": float(item.get("calciumMg") or 0),
            "ironMg": float(item.get("ironMg") or 0),
            "sodiumMg": float(item.get("sodiumMg") or 0),
            "zincMg": float(item.get("zincMg") or 0),
            "vitaminAMcg": float(item.get("vitaminAMcg") or 0),
            "vitaminCMg": float(item.get("vitaminCMg") or 0),
            "sourceTag": item.get("sourceTag") or "fctb",
            "sourceDetail": item.get("sourceDetail") or "Food composition table",
        }
    )
    body = (
        f"Food composition: {name_en}"
        + (f" ({name_bn})" if name_bn else "")
        + f". Category: {normalise_category(item)}."
        + (f" Scientific name: {item.get('scientificName')}." if item.get("scientificName") else "")
        + f" Per 100 g: {item.get('kcalPer100')} kcal, "
        f"{item.get('proteinPer100')} g protein, {item.get('fatPer100')} g fat, "
        f"{item.get('carbPer100')} g carbohydrate, {item.get('fiberPer100')} g fibre, "
        f"{item.get('calciumMg')} mg calcium, {item.get('ironMg')} mg iron."
        f" Source: {item.get('sourceDetail')}."
    )
    CHUNKS.append(
        {
            "docId": "food-facts",
            "chunkIndex": fact_chunks,
            "sourceTag": "food-table",
            "source": item.get("sourceDetail") or "Food composition table",
            "section": name_en[:140],
            "lang": "mixed" if name_bn else "en",
            "text": body,
            "keywords": keywords_of(f"{name_en} {name_bn} {item.get('category') or ''}"),
        }
    )
    fact_chunks += 1
jsonl(OUT / "food_facts.jsonl", facts)
SOURCES.append(
    {
        "key": "food-facts",
        "name": "Unified food composition database (FCTB 2013 + IFCT 2017)",
        "sourceTag": "food-table",
        "recordCount": len(facts),
        "chunkCount": fact_chunks,
        "notes": "913 deduplicated foods with provenance tags",
    }
)
print(f"  {len(facts)} foods", flush=True)

# ── WFP prices + markets ────────────────────────────────────────────────────
print("Prices")
prices: list[dict] = []
seen_prices: set[str] = set()
commodity_series: dict[str, list[dict]] = {}
with (DATA / "wfp_food_prices_bgd.csv").open(
    newline="", encoding="utf-8", errors="replace"
) as handle:
    for row in csv.DictReader(handle):
        raw = (row.get("price") or "").strip().replace(",", "")
        try:
            price = float(raw)
        except ValueError:
            continue
        if price <= 0:
            continue
        date = (row.get("date") or "").strip()
        commodity = (row.get("commodity") or "").strip()
        unit = (row.get("unit") or "").strip()
        market = (row.get("market") or "").strip()
        price_type = (row.get("pricetype") or "").strip()
        if not date or not commodity or not unit:
            continue
        key = sha(f"{date}|{commodity}|{market}|{unit}|{price_type}|{price}")
        if key in seen_prices:
            continue
        seen_prices.add(key)
        record = {
            "key": key,
            "date": date,
            "commodity": commodity,
            "unit": unit,
            "priceBDT": price,
            "usdPrice": float(row["usdprice"]) if (row.get("usdprice") or "").strip().replace(".", "", 1).isdigit() else None,
            "priceType": price_type or None,
            "market": market or None,
            "admin1": (row.get("admin1") or "").strip() or None,
            "category": (row.get("category") or "").strip() or None,
            "source": "WFP Food Prices for Bangladesh (HDX)",
        }
        prices.append(record)
        if record["priceType"] == "Retail":
            commodity_series.setdefault(commodity, []).append(record)
jsonl(OUT / "prices.jsonl", prices)

price_chunks = 0
for commodity, records in commodity_series.items():
    monthly: dict[str, list[float]] = {}
    units: dict[str, int] = {}
    for record in records:
        month = record["date"][:7]
        monthly.setdefault(month, []).append(record["priceBDT"])
        units[record["unit"]] = units.get(record["unit"], 0) + 1
    if not monthly:
        continue
    unit = max(units, key=units.get)
    months = sorted(monthly)[-12:]
    recent = [(month, sum(monthly[month]) / len(monthly[month])) for month in months]
    points = "; ".join(f"{month}: {avg:.0f} BDT" for month, avg in recent)
    body = (
        f"Retail price of {commodity} in Bangladesh ({unit}), monthly national average across markets: "
        f"{points}. Latest month {recent[-1][0]}. Source: WFP VAM, HDX."
    )
    CHUNKS.append(
        {
            "docId": "wfp-prices",
            "chunkIndex": price_chunks,
            "sourceTag": "price",
            "source": "WFP Food Prices for Bangladesh (HDX)",
            "section": commodity[:140],
            "lang": "en",
            "text": body,
            "keywords": keywords_of(commodity),
        }
    )
    price_chunks += 1
SOURCES.append(
    {
        "key": "wfp-prices",
        "name": "WFP Food Prices for Bangladesh (HDX)",
        "sourceTag": "price",
        "recordCount": len(prices),
        "chunkCount": price_chunks,
        "notes": "Monthly market price observations, 1900–2026",
    }
)
print(f"  {len(prices)} price rows, {len(commodity_series)} commodity summaries", flush=True)

markets: list[dict] = []
with (DATA / "wfp_markets_bgd.csv").open(
    newline="", encoding="utf-8", errors="replace"
) as handle:
    for row in csv.DictReader(handle):
        name = (row.get("market") or "").strip()
        if not name:
            continue
        markets.append(
            {
                "marketId": (row.get("market_id") or name).strip(),
                "name": name,
                "admin1": (row.get("admin1") or "").strip(),
                "admin2": (row.get("admin2") or "").strip(),
                "latitude": float(row["latitude"]) if (row.get("latitude") or "").strip() else None,
                "longitude": float(row["longitude"]) if (row.get("longitude") or "").strip() else None,
                "country": (row.get("countryiso3") or "BGD").strip(),
            }
        )
jsonl(OUT / "markets.jsonl", markets)
SOURCES.append(
    {
        "key": "wfp-markets",
        "name": "WFP market coordinates for Bangladesh (HDX)",
        "sourceTag": "market",
        "recordCount": len(markets),
        "chunkCount": 0,
        "notes": "Market geography metadata",
    }
)
print(f"  {len(markets)} markets", flush=True)

# ── FAOSTAT indicators ──────────────────────────────────────────────────────
print("FAOSTAT")
indicators: list[dict] = []
seen_ind: set[str] = set()


def add_indicator(dataset: str, item: str, element: str, unit: str, year: str, value: float, flag: str) -> None:
    key = sha(f"{dataset}|{item}|{element}|{year}")
    if key in seen_ind:
        return
    seen_ind.add(key)
    indicators.append(
        {
            "key": key,
            "dataset": dataset,
            "item": item,
            "element": element,
            "unit": unit,
            "year": str(year),
            "value": value,
            "flag": flag or None,
            "source": "FAOSTAT (via HDX)",
        }
    )


with (DATA / "bgd_faostat_food_balances.csv").open(
    newline="", encoding="utf-8", errors="replace"
) as handle:
    for row in csv.DictReader(handle):
        try:
            value = float((row.get("Value") or "").replace(",", ""))
        except ValueError:
            continue
        add_indicator(
            "food-balance",
            (row.get("Item") or "").strip(),
            (row.get("Element") or "").strip(),
            (row.get("Unit") or "").strip(),
            (row.get("Year") or "").strip(),
            value,
            (row.get("Flag") or "").strip(),
        )

with (DATA / "bgd_faostat_food_security_indicators.csv").open(
    newline="", encoding="utf-8", errors="replace"
) as handle:
    for row in csv.DictReader(handle):
        try:
            value = float((row.get("Value") or "").replace(",", ""))
        except ValueError:
            continue
        add_indicator(
            "food-security",
            (row.get("Item") or "").strip(),
            (row.get("Element") or "").strip(),
            (row.get("Unit") or "").strip(),
            (row.get("Year") or "").strip(),
            value,
            (row.get("Flag") or "").strip(),
        )

with (DATA / "bgd_faostat_cost_affordability_healthy_diet.csv").open(
    newline="", encoding="utf-8", errors="replace"
) as handle:
    for row in csv.DictReader(handle):
        try:
            value = float((row.get("Value") or "").replace(",", ""))
        except ValueError:
            continue
        add_indicator(
            "affordability",
            (row.get("Item") or "").strip(),
            (row.get("Element") or "").strip(),
            (row.get("Unit") or "").strip(),
            (row.get("Year") or "").strip(),
            value,
            (row.get("Flag") or "").strip(),
        )
jsonl(OUT / "indicators.jsonl", indicators)

faostat_chunks = 0
balance_keys = [
    "Food supply (kcal/capita/day)",
    "Protein supply quantity (g/capita/day)",
    "Fat supply quantity (g/capita/day)",
    "Food supply quantity (kg/capita/yr)",
]
by_item: dict[str, list[dict]] = {}
for row in indicators:
    if row["dataset"] == "food-balance" and row["element"] in balance_keys:
        by_item.setdefault(row["item"], []).append(row)
for item, rows in by_item.items():
    rows.sort(key=lambda r: r["year"])
    latest_year = rows[-1]["year"]
    latest = [r for r in rows if r["year"] == latest_year]
    parts = "; ".join(f"{r['element']}: {r['value']} {r['unit']}" for r in latest)
    body = (
        f"FAOSTAT food balance for {item} in Bangladesh, {latest_year}: {parts}. "
        "Source: FAOSTAT food balance sheets."
    )
    CHUNKS.append(
        {
            "docId": "faostat-balance",
            "chunkIndex": faostat_chunks,
            "sourceTag": "faostat",
            "source": "FAOSTAT food balance sheets for Bangladesh",
            "section": item[:140],
            "lang": "en",
            "text": body,
            "keywords": keywords_of(item),
        }
    )
    faostat_chunks += 1

security_by_item: dict[str, list[dict]] = {}
for row in indicators:
    if row["dataset"] == "food-security":
        security_by_item.setdefault(row["item"], []).append(row)
for item, rows in security_by_item.items():
    rows.sort(key=lambda r: r["year"])
    latest = rows[-1]
    body = (
        f"Bangladesh food security indicator: {item}. Latest value {latest['value']} "
        f"{latest['unit']} ({latest['year']}). Source: FAOSTAT food security indicators."
    )
    CHUNKS.append(
        {
            "docId": "faostat-security",
            "chunkIndex": faostat_chunks,
            "sourceTag": "faostat",
            "source": "FAOSTAT food security indicators for Bangladesh",
            "section": item[:140],
            "lang": "en",
            "text": body,
            "keywords": keywords_of(item),
        }
    )
    faostat_chunks += 1

affordability = [r for r in indicators if r["dataset"] == "affordability"]
if affordability:
    latest = sorted(affordability, key=lambda r: r["year"])[-1]
    CHUNKS.append(
        {
            "docId": "faostat-affordability",
            "chunkIndex": faostat_chunks,
            "sourceTag": "faostat",
            "source": "FAOSTAT cost and affordability of a healthy diet",
            "section": latest["item"][:140],
            "lang": "en",
            "text": (
                f"{latest['item']} in Bangladesh: {latest['value']} {latest['unit']} "
                f"({latest['year']}). Source: FAOSTAT."
            ),
            "keywords": keywords_of(latest["item"]),
        }
    )
    faostat_chunks += 1

SOURCES.append(
    {
        "key": "faostat-bgd",
        "name": "FAOSTAT Bangladesh food balance, security and affordability",
        "sourceTag": "faostat",
        "recordCount": len(indicators),
        "chunkCount": faostat_chunks,
        "notes": "23k food balance rows, 1.2k security rows, affordability series",
    }
)
print(f"  {len(indicators)} indicator rows, {faostat_chunks} summaries", flush=True)

# ── Food alias index (Bangla/Banglish retrieval bridge) ─────────────────────
print("Food aliases")
alias_rows = json.loads(
    subprocess.run(
        ["bun", "-e", "import {FOOD_SEED} from './src/lib/foods/seed'; console.log(JSON.stringify(FOOD_SEED))"],
        cwd=ROOT,
        capture_output=True,
        check=True,
    ).stdout.decode("utf-8")
)
alias_chunks = 0
for food in alias_rows:
    name_en = food.get("nameEn") or ""
    if not name_en:
        continue
    aliases = food.get("aliases") or []
    measures = food.get("measures") or []
    body = (
        f"Deshi food name: {name_en} | Bangla: {food.get('nameBn') or ''}"
        + (f" | also called: {', '.join(aliases)}" if aliases else "")
        + (f" | household portions: {', '.join(m.get('label','') + '=' + str(m.get('grams','')) + 'g' for m in measures)}" if measures else "")
        + f" | {food.get('kcalPer100')} kcal per 100 g."
    )
    CHUNKS.append(
        {
            "docId": "food-aliases",
            "chunkIndex": alias_chunks,
            "sourceTag": "food-table",
            "source": "Deshi food alias index (project seed)",
            "section": name_en[:140],
            "lang": "mixed" if (food.get("nameBn") or aliases) else "en",
            "text": body,
            "keywords": keywords_of(f"{name_en} {food.get('nameBn') or ''} {' '.join(aliases)}"),
        }
    )
    alias_chunks += 1
SOURCES.append(
    {
        "key": "food-aliases",
        "name": "Deshi food alias index (project seed)",
        "sourceTag": "food-table",
        "recordCount": len(alias_rows),
        "chunkCount": alias_chunks,
        "notes": "Bangla + Banglish aliases bridge vernacular queries to food names",
    }
)
print(f"  {alias_chunks} alias chunks", flush=True)

# ── write chunks + source inventory ─────────────────────────────────────────
jsonl(OUT / "chunks.jsonl", CHUNKS)
for source in SOURCES:
    source["license"] = source.get("license")
    source["ingestedAt"] = 0
(OUT / "sources.json").write_text(json.dumps(SOURCES, ensure_ascii=False, indent=2), encoding="utf-8")

print("\nTotals")
print(f"  chunks: {len(CHUNKS)}")
print(f"  recipes: {len(recipes)}")
print(f"  foods: {len(facts)}")
print(f"  prices: {len(prices)}")
print(f"  markets: {len(markets)}")
print(f"  indicators: {len(indicators)}")
by_tag: dict[str, int] = {}
for chunk in CHUNKS:
    by_tag[chunk["sourceTag"]] = by_tag.get(chunk["sourceTag"], 0) + 1
print("  chunks by source tag:", by_tag)
