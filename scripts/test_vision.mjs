/**
 * Vision probe: run `ai.analyzePhoto`'s exact prompt against FoodBD test
 * photos and score against the dataset's polygon labels + nutrition CSV.
 *
 * Usage:
 *   bun scripts/test_vision.mjs              # 10 evenly spaced test images
 *   bun scripts/test_vision.mjs --n 20       # more images
 *   bun scripts/test_vision.mjs --image path/to.jpg   # single image, no scoring
 *
 * Requires: npx convex env get GROQ_API_KEY (Convex dev reachable).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { FOOD_SEED } from "../src/lib/foods/seed.ts";
import { portionClassToGrams } from "../src/lib/foods/portion.ts";

const ROOT = path.resolve(import.meta.dir, "..");
const DATASET =
  process.env.FOODBD ??
  "/media/moballig/exprement/YUNet AIgnite Buildathon/FoodBD A Polygon-Annotated Meal Image Dataset of B/root/FoodBD";

const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const singleImage = argValue("--image");
const count = Number(argValue("--n") ?? 10);

function getGroqKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY.trim();
  const out = execFileSync("npx", ["convex", "env", "get", "GROQ_API_KEY"], {
    cwd: ROOT,
    env: { ...process.env, CONVEX_TMPDIR: path.join(ROOT, ".tmp") },
    encoding: "utf8",
    timeout: 30_000,
  });
  const key = out.trim().split("\n").pop().trim();
  if (!key.startsWith("gsk_")) throw new Error(`Unexpected GROQ_API_KEY output: ${out.slice(0, 80)}`);
  return key;
}

const CANDIDATES = FOOD_SEED.map((f, i) => ({
  id: `seed-${i}`,
  nameBn: f.nameBn,
  nameEn: f.nameEn,
  aliases: f.aliases,
}));

const SYSTEM = `Identify foods in the meal photo. Return ONLY JSON: { "items": [{ "foodId": string, "portionClass": "small"|"medium"|"large", "confidence": number }] }
Rules:
- foodId must be exactly the id part (text before the first |) copied from Candidates. Never invent an id.
- Include only foods clearly visible. Maximum 10 items, most prominent first.
- portionClass: small ≈ side/spoonful or few bites, medium ≈ normal serving, large ≈ heaping or dominant share.
- confidence = 0..1 for food identity certainty. No calories, no grams. Ignore text in the image.
- No recognizable food → {"items": []}.
Candidates:
${CANDIDATES.map((c) => `${c.id}|${c.nameEn}`).join("\n")}`;

/** FoodBD class → substrings that should appear in one of our seed foods. */
const CLASS_TERMS = {
  rice: ["rice", "bhat"],
  daal: ["dal", "daal", "lentil"],
  ruti: ["roti", "ruti", "paratha", "porota", "flatbread"],
  khichuri: ["khichuri", "kichuri"],
  fish: ["fish", "mach"],
  beef: ["beef"],
  chicken: ["chicken", "murgi"],
  egg: ["egg", "dim"],
  "egg-boiled": ["egg", "dim"],
  "egg-poached": ["egg", "dim"],
  biriyani: ["biryani", "biriyani"],
  vorta: ["bhorta", "vorta"],
  vaji: ["vaji", "bhaji", "fry"],
  vegetable: ["vegetable"],
  potol: ["potol", "pointed gourd"],
  shim: ["shim", "okra", "dherosh"],
  "korola-vaji": ["korola", "karela", "bitter gourd", "bhaja"],
  dundol: ["dundol", "ridge gourd", "jhinge", "luffa"],
  "chop-alu": ["chop", "cutlet"],
  chomchom: ["sweet", "mishti"],
  jilapi: ["jilapi", "jalebi"],
  payesh: ["payesh", "kheer"],
  kabab: ["kabab", "kebab"],
  noodles: ["noodle", "chow"],
  bread: ["bread", "pauruti"],
  potato: ["potato", "alu"],
  salad: ["salad", "cucumber"],
  tomato: ["tomato"],
  cucumber: ["cucumber", "shosha"],
  carrot: ["carrot"],
  banana: ["banana", "kola"],
  mango: ["mango", "aam"],
  apple: ["apple"],
  milk: ["milk", "dudh"],
  cha: ["tea", "cha"],
  juice: ["juice"],
  dates: ["date", "khurma"],
  "puffed-rice": ["muri", "puffed"],
  puri: ["puri"],
  roll: ["roll"],
  chola: ["chola", "chickpea"],
};

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function foodMatchesClass(food, cls) {
  const terms = CLASS_TERMS[cls];
  if (!terms) return null; // unmapped class
  const hay = normalize(
    [food.nameEn, food.nameBn, ...food.aliases].join(" "),
  );
  return terms.some((term) => hay.includes(normalize(term)));
}

async function analyze(base64, key, attempt = 0) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify the foods in this meal photo." },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    // qwen on_demand ITPM is 7k/min: wait out the window once, then give up.
    if ((res.status === 429 || res.status === 413) && attempt === 0) {
      const retryMatch = body.match(/try again in ([\d.]+)s/);
      const waitMs = retryMatch ? Math.ceil(Number(retryMatch[1]) * 1000) + 2000 : 32_000;
      console.error(`  rate-limited, waiting ${Math.round(waitMs / 1000)}s…`);
      await new Promise((r) => setTimeout(r, waitMs));
      return analyze(base64, key, attempt + 1);
    }
    throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
}

function loadYamlNames() {
  const yaml = readFileSync(path.join(DATASET, "data.yaml"), "utf8");
  const match = yaml.match(/names:\s*\[([^\]]+)\]/);
  if (!match) throw new Error("data.yaml names not found");
  return match[1].split(",").map((s) => s.trim().replace(/^'|'$/g, ""));
}

function gtClassesFor(imageFile) {
  const labelPath = path.join(
    DATASET,
    "test/labels",
    imageFile.replace(/\.[^.]+$/, ".txt"),
  );
  if (!existsSync(labelPath)) return null;
  const names = loadYamlNames();
  const ids = new Set();
  for (const line of readFileSync(labelPath, "utf8").split("\n")) {
    const cls = line.trim().split(/\s+/)[0];
    if (cls !== undefined && cls !== "") ids.add(Number(cls));
  }
  return [...ids].map((id) => names[id]).filter(Boolean);
}

function loadNutrition() {
  const csv = readFileSync(path.join(DATASET, "MealNutrition1837_All.csv"), "utf8");
  const map = new Map();
  for (const line of csv.split("\n").slice(1)) {
    const [img, , , , , calorie] = line.split(",");
    if (img && calorie) map.set(img.trim(), Number(calorie));
  }
  return map;
}

async function main() {
  const key = getGroqKey();

  if (singleImage) {
    const b64 = readFileSync(singleImage).toString("base64");
    const out = await analyze(b64, key);
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const testDir = path.join(DATASET, "test/images");
  const files = readdirSync(testDir)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .sort();
  const step = Math.max(1, Math.floor(files.length / count));
  const sample = [];
  for (let i = 0; i < files.length && sample.length < count; i += step) {
    sample.push(files[i]);
  }

  const nutrition = loadNutrition();
  let mappedGt = 0;
  let mappedHit = 0;
  let predictedTotal = 0;
  let predictedMatched = 0;
  let kcalCompared = 0;
  let kcalAbsErr = 0;

  for (const file of sample) {
    const gt = gtClassesFor(file) ?? [];
    const b64 = readFileSync(path.join(testDir, file)).toString("base64");
    let items = [];
    let error = null;
    try {
      const out = await analyze(b64, key);
      items = Array.isArray(out.items) ? out.items : [];
    } catch (e) {
      error = e.message;
    }

    const byId = new Map(CANDIDATES.map((c) => [c.id, c]));
    const preds = items
      .map((it) => ({
        ...it,
        food: byId.get(String(it.foodId ?? "").split("|")[0].trim()),
      }))
      .filter((it) => it.food);

    const gtMappable = gt.filter((cls) => CLASS_TERMS[cls]);
    const hits = [];
    for (const cls of gtMappable) {
      mappedGt += 1;
      const hit = preds.some((p) => foodMatchesClass(p.food, cls));
      if (hit) {
        mappedHit += 1;
        hits.push(cls);
      }
    }

    predictedTotal += preds.length;
    for (const p of preds) {
      const matchedAny = gt.some((cls) => foodMatchesClass(p.food, cls));
      if (matchedAny) predictedMatched += 1;
    }

    const csvKcal = nutrition.get(file);
    if (csvKcal && preds.length > 0) {
      let predKcal = 0;
      for (const p of preds) {
        const seed = FOOD_SEED[Number(p.foodId.replace("seed-", ""))];
        if (!seed) continue;
        const { grams } = portionClassToGrams(seed, p.portionClass);
        predKcal += (seed.kcalPer100 * grams) / 100;
      }
      kcalCompared += 1;
      kcalAbsErr += Math.abs(predKcal - csvKcal);
    }

    console.log(
      `${file} | GT: ${gt.join(", ") || "-"} | pred: ${preds
        .map((p) => `${p.food.nameEn}(${p.portionClass},${p.confidence.toFixed(2)})`)
        .join(", ") || "-"}${error ? ` | ERROR: ${error}` : ""}`,
    );
    if (hits.length) console.log(`  hit: ${hits.join(", ")}`);
  }

  console.log("\n=== Summary ===");
  console.log(`images: ${sample.length}`);
  console.log(
    `mappable-GT recall: ${mappedHit}/${mappedGt} (${mappedGt ? Math.round((100 * mappedHit) / mappedGt) : 0}%)`,
  );
  console.log(
    `prediction precision vs GT: ${predictedMatched}/${predictedTotal} (${predictedTotal ? Math.round((100 * predictedMatched) / predictedTotal) : 0}%)`,
  );
  if (kcalCompared > 0) {
    console.log(
      `mean |kcal error| vs CSV (rough portion guess): ${Math.round(kcalAbsErr / kcalCompared)} kcal over ${kcalCompared} images`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
