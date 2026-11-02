#!/usr/bin/env node
/**
 * Simulates the coach retrieval flow: original embedding → optional Groq
 * rewrite (Bangla / weak first pass) → second embedding → merged results.
 *
 * Usage: node scripts/test_rag_rewrite.mjs "ডায়াবেটিস থাকলে ভাত কত খাব?" ...
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { pipeline, env as hfEnv } from "@huggingface/transformers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = {};
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match) envFile[match[1]] = match[2];
}
const client = new ConvexHttpClient(envFile.NEXT_PUBLIC_CONVEX_URL);
hfEnv.cacheDir = path.join(ROOT, ".cache", "transformers");
const extractor = await pipeline("feature-extraction", "Xenova/multilingual-e5-small", {
  dtype: "q8",
});

const THRESHOLD = 0.8;

async function embed(text) {
  const output = await extractor([`query: ${text}`], { pooling: "mean", normalize: true });
  return output.tolist()[0];
}

function merge(a, b) {
  const byId = new Map();
  for (const hit of [...a, ...b]) {
    const prev = byId.get(hit.id);
    if (!prev || hit.score > prev.score) byId.set(hit.id, hit);
  }
  return [...byId.values()].sort((x, y) => y.score - x.score);
}

const queries = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["ডায়াবেটিস থাকলে ভাত কত খাব?", "খিচুড়ি কত ক্যালোরি", "alu bhorta"];

for (const query of queries) {
  const original = await client.action(api.rag.search, {
    query,
    queryEmbedding: await embed(query),
    limit: 6,
  });
  const rewrite = await client.action(api.ai.rewriteQuery, { query: query.slice(0, 300) });
  let merged = original;
  if (rewrite.rewritten) {
    const second = await client.action(api.rag.search, {
      query,
      queryEmbedding: await embed(rewrite.rewritten),
      limit: 6,
    });
    merged = merge(original, second);
  }
  const hits = merged.filter((h) => h.score >= THRESHOLD).slice(0, 5);
  console.log(`\nQ: ${query}`);
  console.log(`  rewrite: ${rewrite.rewritten ?? "(none)"}${rewrite.error ? ` (${rewrite.error})` : ""}`);
  for (const hit of hits) {
    console.log(`  ${hit.score.toFixed(3)} [${hit.sourceTag}] ${hit.source.slice(0, 55)}${hit.page ? ` p.${hit.page}` : ""}`);
    console.log(`        ${hit.text.replace(/\s+/g, " ").slice(0, 120)}`);
  }
  if (hits.length === 0) console.log("  (no hits above threshold)");
}
