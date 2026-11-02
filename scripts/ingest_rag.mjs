#!/usr/bin/env node
/**
 * Push /data extracts into Convex as a RAG knowledge base + structured tables.
 *
 * Prerequisites:
 *   python3 scripts/prepare_rag_data.py
 *   npx convex env set RAG_INGEST_TOKEN=<token>   (already in .env.local)
 *
 * Usage:
 *   node scripts/ingest_rag.mjs                 # everything
 *   node scripts/ingest_rag.mjs --skip-chunks   # structured tables only
 *   node scripts/ingest_rag.mjs --limit 200     # small smoke run
 *   node scripts/ingest_rag.mjs --fresh         # clear ragChunks first
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline, env as hfEnv } from "@huggingface/transformers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts", "out");

function readEnvFile() {
  const map = {};
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) map[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return map;
}

const fileEnv = readEnvFile();
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? fileEnv.NEXT_PUBLIC_CONVEX_URL;
const token = process.env.RAG_INGEST_TOKEN ?? fileEnv.RAG_INGEST_TOKEN;
if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is missing");
if (!token) throw new Error("RAG_INGEST_TOKEN is missing");

const client = new ConvexHttpClient(convexUrl);
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const valueOf = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};

const SKIP_CHUNKS = has("--skip-chunks");
const SKIP_STRUCTURED = has("--skip-structured");
const FRESH = has("--fresh");
const LIMIT = Number.parseInt(valueOf("--limit", "0"), 10) || 0;
const ONLY_DOCS = String(valueOf("--docs", "") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function readJsonl(name) {
  const file = path.join(OUT, name);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}. Run: python3 scripts/prepare_rag_data.py`);
  }
  const rows = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed) rows.push(JSON.parse(trimmed));
  }
  return LIMIT ? rows.slice(0, LIMIT) : rows;
}

function stripEmpty(value) {
  if (Array.isArray(value)) return value.map(stripEmpty);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined && item !== null) out[key] = stripEmpty(item);
    }
    return out;
  }
  return value;
}

async function withRetry(label, fn, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const wait = 500 * attempt;
      console.warn(`  ! ${label} failed (attempt ${attempt}/${attempts}): ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw lastError;
}

async function pushStructured(label, rows, mutation, argName, batchSize = 50) {
  if (rows.length === 0) {
    console.log(`  ${label}: nothing to push`);
    return { inserted: 0, updated: 0 };
  }
  let inserted = 0;
  let updated = 0;
  const started = Date.now();
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize).map(stripEmpty);
    const result = await withRetry(`${label} ${index}`, () =>
      client.mutation(mutation, { token, [argName]: batch }),
    );
    inserted += result.inserted;
    updated += result.updated;
    const done = Math.min(index + batchSize, rows.length);
    if (done % (batchSize * 10) === 0 || done === rows.length) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = done / Math.max(elapsed, 0.001);
      const eta = Math.round((rows.length - done) / Math.max(rate, 0.001));
      console.log(`  ${label}: ${done}/${rows.length} (${rate.toFixed(1)}/s, eta ${eta}s)`);
    }
  }
  console.log(`  ${label}: +${inserted} new, ~${updated} updated`);
  return { inserted, updated };
}

async function clearChunks() {
  let total = 0;
  for (;;) {
    const deleted = await withRetry("clear chunks", () =>
      client.mutation(api.rag.clearChunks, { token, limit: 400 }),
    );
    total += deleted;
    if (deleted === 0) break;
    if (total % 2000 === 0) console.log(`  cleared ${total} chunks`);
  }
  console.log(`  cleared ${total} old chunks`);
}

async function embedAndPushChunks(chunks) {
  if (chunks.length === 0) return 0;
  hfEnv.cacheDir = path.join(ROOT, ".cache", "transformers");
  console.log("  loading multilingual-e5-small (local, 384 dims)…");
  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/multilingual-e5-small",
    { dtype: "q8" },
  );

  const batchSize = 16;
  const started = Date.now();
  let pushed = 0;
  for (let index = 0; index < chunks.length; index += batchSize) {
    const batch = chunks.slice(index, index + batchSize);
    const texts = batch.map((chunk) => `passage: ${chunk.text}`);
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    const vectors = output.tolist();
    const payload = batch.map((chunk, offset) => ({
      ...stripEmpty(chunk),
      embedding: vectors[offset],
    }));
    await withRetry(`chunks ${index}`, () =>
      client.mutation(api.rag.pushChunks, {
        token,
        chunks: payload,
        mode: ONLY_DOCS.length > 0 ? "upsert" : "insert",
      }),
    );
    pushed += batch.length;
    if (pushed % 160 === 0 || pushed === chunks.length) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = pushed / Math.max(elapsed, 0.001);
      const eta = Math.round((chunks.length - pushed) / Math.max(rate, 0.001));
      console.log(`  chunks: ${pushed}/${chunks.length} (${rate.toFixed(1)}/s, eta ${eta}s)`);
    }
  }
  return pushed;
}

async function main() {
  console.log(`Convex: ${convexUrl}`);
  const startedAt = Date.now();

  if (!FRESH && !SKIP_CHUNKS && ONLY_DOCS.length === 0) {
    const existing = await client.query(api.rag.sources, {});
    const chunks = existing.reduce((total, source) => total + source.chunkCount, 0);
    if (chunks > 0) {
      throw new Error(
        `ragChunks already has ~${chunks} chunks indexed. Re-run with --fresh to replace them.`,
      );
    }
  }

  if (!SKIP_STRUCTURED) {
    console.log("\nStructured datasets");
    const facts = readJsonl("food_facts.jsonl");
    const recipes = readJsonl("recipes.jsonl");
    const markets = readJsonl("markets.jsonl");
    const prices = readJsonl("prices.jsonl");
    const indicators = readJsonl("indicators.jsonl");

    await pushStructured("food facts", facts, api.rag.pushFoodFacts, "facts");
    await pushStructured("recipes", recipes, api.rag.pushRecipes, "recipes");
    await pushStructured("markets", markets, api.rag.pushMarkets, "markets");
    await pushStructured("prices", prices, api.rag.pushPrices, "prices", 80);
    await pushStructured("indicators", indicators, api.rag.pushIndicators, "indicators", 80);
  }

  if (!SKIP_CHUNKS) {
    console.log("\nRAG chunks");
    let chunks = readJsonl("chunks.jsonl");
    if (ONLY_DOCS.length > 0) {
      chunks = chunks.filter((chunk) => ONLY_DOCS.includes(chunk.docId));
      console.log(`  limited to docs: ${ONLY_DOCS.join(", ")} (${chunks.length} chunks)`);
    }
    if (FRESH) await clearChunks();
    const pushed = await embedAndPushChunks(chunks);
    console.log(`  embedded and pushed ${pushed} chunks`);
  }

  const sourcesFile = path.join(OUT, "sources.json");
  if (fs.existsSync(sourcesFile)) {
    const sources = JSON.parse(fs.readFileSync(sourcesFile, "utf8")).map((source) => ({
      ...source,
      ingestedAt: Date.now(),
    }));
    console.log("\nSource inventory");
    await pushStructured("sources", sources, api.rag.pushSources, "sources", 20);
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nDone in ${seconds}s`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
