#!/usr/bin/env node
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
const extractor = await pipeline("feature-extraction", "Xenova/multilingual-e5-small", { dtype: "q8" });

const queries = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "ডায়াবেটিস থাকলে ভাত কত খাব?",
      "how much protein is in ilish fish",
      "what is a healthy plate for lunch",
      "price of rice in Dhaka",
      "bhorta vorta ভর্তা",
    ];

for (const query of queries) {
  const output = await extractor([`query: ${query}`], { pooling: "mean", normalize: true });
  const embedding = output.tolist()[0];
  const hits = await client.action(api.rag.search, { query, queryEmbedding: embedding, limit: 4 });
  console.log(`\nQ: ${query}`);
  for (const hit of hits) {
    console.log(`  ${hit.score.toFixed(3)} [${hit.sourceTag}] ${hit.source.slice(0, 60)}${hit.page ? ` p.${hit.page}` : ""}`);
    console.log(`        ${hit.text.replace(/\s+/g, " ").slice(0, 150)}`);
  }
}
