import { v } from "convex/values";
import {
  action,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { ragLang, ragSourceTag } from "./schema";
import schema from "./schema";

const EMBEDDING_DIMENSIONS = 384;
const MAX_BATCH = 100;

function requireIngestToken(token: string) {
  const expected = process.env.RAG_INGEST_TOKEN;
  if (!expected) {
    throw new Error("RAG_INGEST_TOKEN is not configured on this deployment");
  }
  if (token !== expected) {
    throw new Error("Unauthorized RAG ingest request");
  }
}

const chunkArgs = v.object({
  docId: v.string(),
  chunkIndex: v.number(),
  sourceTag: ragSourceTag,
  source: v.string(),
  section: v.optional(v.string()),
  page: v.optional(v.number()),
  lang: ragLang,
  text: v.string(),
  keywords: v.array(v.string()),
  embedding: v.array(v.float64()),
  url: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
});

const chunkResult = v.object({
  id: v.id("ragChunks"),
  text: v.string(),
  source: v.string(),
  sourceTag: ragSourceTag,
  section: v.optional(v.string()),
  page: v.optional(v.number()),
  lang: ragLang,
  url: v.optional(v.string()),
  score: v.number(),
});

const recipeArgs = v.object({
  key: v.string(),
  name: v.string(),
  cuisine: v.string(),
  minutes: v.optional(v.number()),
  ingredients: v.array(v.string()),
  instructions: v.string(),
  url: v.optional(v.string()),
  source: v.string(),
  region: v.optional(v.string()),
});

const foodFactArgs = v.object({
  key: v.string(),
  nameEn: v.string(),
  nameBn: v.string(),
  scientificName: v.optional(v.string()),
  category: v.string(),
  kcalPer100: v.number(),
  proteinPer100: v.number(),
  fatPer100: v.number(),
  carbPer100: v.number(),
  fiberPer100: v.optional(v.number()),
  calciumMg: v.optional(v.number()),
  ironMg: v.optional(v.number()),
  sodiumMg: v.optional(v.number()),
  zincMg: v.optional(v.number()),
  vitaminAMcg: v.optional(v.number()),
  vitaminCMg: v.optional(v.number()),
  sourceTag: v.union(
    v.literal("fctb"),
    v.literal("regional-table"),
    v.literal("indigenous"),
  ),
  sourceDetail: v.string(),
  regionTags: v.optional(v.array(v.string())),
});

const priceArgs = v.object({
  key: v.string(),
  date: v.string(),
  commodity: v.string(),
  unit: v.string(),
  priceBDT: v.number(),
  usdPrice: v.optional(v.number()),
  priceType: v.optional(v.string()),
  market: v.optional(v.string()),
  admin1: v.optional(v.string()),
  category: v.optional(v.string()),
  source: v.string(),
});

const marketArgs = v.object({
  marketId: v.string(),
  name: v.string(),
  admin1: v.string(),
  admin2: v.string(),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  country: v.string(),
});

const indicatorArgs = v.object({
  key: v.string(),
  dataset: v.union(
    v.literal("food-balance"),
    v.literal("food-security"),
    v.literal("affordability"),
  ),
  item: v.string(),
  element: v.string(),
  unit: v.string(),
  year: v.string(),
  value: v.number(),
  flag: v.optional(v.string()),
  source: v.string(),
});

const sourceArgs = v.object({
  key: v.string(),
  name: v.string(),
  sourceTag: ragSourceTag,
  license: v.optional(v.string()),
  url: v.optional(v.string()),
  recordCount: v.number(),
  chunkCount: v.number(),
  ingestedAt: v.number(),
  notes: v.optional(v.string()),
});

type KeyedTable =
  | "foodFacts"
  | "recipes"
  | "priceObservations"
  | "nutritionIndicators"
  | "datasetSources";

async function findKeyedId(
  ctx: MutationCtx,
  table: KeyedTable,
  key: string,
): Promise<string | undefined> {
  switch (table) {
    case "foodFacts": {
      const row = await ctx.db
        .query("foodFacts")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      return row?._id;
    }
    case "recipes": {
      const row = await ctx.db
        .query("recipes")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      return row?._id;
    }
    case "priceObservations": {
      const row = await ctx.db
        .query("priceObservations")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      return row?._id;
    }
    case "nutritionIndicators": {
      const row = await ctx.db
        .query("nutritionIndicators")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      return row?._id;
    }
    case "datasetSources": {
      const row = await ctx.db
        .query("datasetSources")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      return row?._id;
    }
  }
}

async function keyedIds(
  ctx: MutationCtx,
  table: KeyedTable,
  keys: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  for (const key of keys) {
    const id = await findKeyedId(ctx, table, key);
    if (id) found.set(key, id);
  }
  return found;
}

/** Upsert RAG chunks. Idempotent on (docId, chunkIndex). */
export const pushChunks = mutation({
  args: {
    token: v.string(),
    chunks: v.array(chunkArgs),
    mode: v.optional(v.union(v.literal("insert"), v.literal("upsert"))),
  },
  returns: v.object({ inserted: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    if (args.chunks.length > MAX_BATCH) {
      throw new Error(`Batch too large (max ${MAX_BATCH})`);
    }
    for (const chunk of args.chunks) {
      if (chunk.embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding for ${chunk.docId}#${chunk.chunkIndex} has ${chunk.embedding.length} dimensions`,
        );
      }
      if (chunk.text.length > 8000) {
        throw new Error(`Chunk ${chunk.docId}#${chunk.chunkIndex} is too long`);
      }
    }

    if (args.mode === "insert") {
      for (const chunk of args.chunks) {
        await ctx.db.insert("ragChunks", chunk);
      }
      return { inserted: args.chunks.length, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;
    for (const chunk of args.chunks) {
      const hits = await ctx.db
        .query("ragChunks")
        .withIndex("by_doc_chunk", (q) =>
          q.eq("docId", chunk.docId).eq("chunkIndex", chunk.chunkIndex),
        )
        .take(8);
      if (hits.length > 0) {
        await ctx.db.patch(hits[0]._id, chunk);
        // Self-heal: remove any duplicate rows sharing the same key.
        for (const extra of hits.slice(1)) {
          await ctx.db.delete(extra._id);
        }
        updated += 1;
      } else {
        await ctx.db.insert("ragChunks", chunk);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

/** Delete up to `limit` chunks (for a doc or the whole corpus) before a re-ingest. */
export const clearChunks = mutation({
  args: {
    token: v.string(),
    docId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    const limit = Math.min(Math.max(args.limit ?? 200, 1), 400);
    const rows = args.docId
      ? await ctx.db
          .query("ragChunks")
          .withIndex("by_doc", (q) => q.eq("docId", args.docId as string))
          .take(limit)
      : await ctx.db.query("ragChunks").take(limit);
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return rows.length;
  },
});

export const pushRecipes = mutation({
  args: { token: v.string(), recipes: v.array(recipeArgs) },
  returns: v.object({ inserted: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    if (args.recipes.length > MAX_BATCH) throw new Error("Batch too large");
    const ids = await keyedIds(ctx, "recipes", args.recipes.map((r) => r.key));
    let inserted = 0;
    let updated = 0;
    for (const recipe of args.recipes) {
      const id = ids.get(recipe.key);
      if (id) {
        await ctx.db.patch(id as Id<"recipes">, recipe);
        updated += 1;
      } else {
        await ctx.db.insert("recipes", recipe);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

export const pushFoodFacts = mutation({
  args: { token: v.string(), facts: v.array(foodFactArgs) },
  returns: v.object({ inserted: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    if (args.facts.length > MAX_BATCH) throw new Error("Batch too large");
    const ids = await keyedIds(ctx, "foodFacts", args.facts.map((f) => f.key));
    let inserted = 0;
    let updated = 0;
    for (const fact of args.facts) {
      const id = ids.get(fact.key);
      if (id) {
        await ctx.db.patch(id as Id<"foodFacts">, fact);
        updated += 1;
      } else {
        await ctx.db.insert("foodFacts", fact);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

export const pushPrices = mutation({
  args: { token: v.string(), prices: v.array(priceArgs) },
  returns: v.object({ inserted: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    if (args.prices.length > MAX_BATCH) throw new Error("Batch too large");
    const ids = await keyedIds(ctx, "priceObservations", args.prices.map((p) => p.key));
    let inserted = 0;
    let updated = 0;
    for (const price of args.prices) {
      const id = ids.get(price.key);
      if (id) {
        await ctx.db.patch(id as Id<"priceObservations">, price);
        updated += 1;
      } else {
        await ctx.db.insert("priceObservations", price);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

export const pushMarkets = mutation({
  args: { token: v.string(), markets: v.array(marketArgs) },
  returns: v.object({ inserted: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    if (args.markets.length > MAX_BATCH) throw new Error("Batch too large");
    let inserted = 0;
    let updated = 0;
    for (const market of args.markets) {
      const existing = await ctx.db
        .query("markets")
        .withIndex("by_market_id", (q) => q.eq("marketId", market.marketId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, market);
        updated += 1;
      } else {
        await ctx.db.insert("markets", market);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

export const pushIndicators = mutation({
  args: { token: v.string(), indicators: v.array(indicatorArgs) },
  returns: v.object({ inserted: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    if (args.indicators.length > MAX_BATCH) throw new Error("Batch too large");
    const ids = await keyedIds(
      ctx,
      "nutritionIndicators",
      args.indicators.map((indicator) => indicator.key),
    );
    let inserted = 0;
    let updated = 0;
    for (const indicator of args.indicators) {
      const id = ids.get(indicator.key);
      if (id) {
        await ctx.db.patch(id as Id<"nutritionIndicators">, indicator);
        updated += 1;
      } else {
        await ctx.db.insert("nutritionIndicators", indicator);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

export const pushSources = mutation({
  args: { token: v.string(), sources: v.array(sourceArgs) },
  returns: v.object({ inserted: v.number(), updated: v.number() }),
  handler: async (ctx, args) => {
    requireIngestToken(args.token);
    if (args.sources.length > MAX_BATCH) throw new Error("Batch too large");
    const ids = await keyedIds(ctx, "datasetSources", args.sources.map((s) => s.key));
    let inserted = 0;
    let updated = 0;
    for (const source of args.sources) {
      const id = ids.get(source.key);
      if (id) {
        await ctx.db.patch(id as Id<"datasetSources">, source);
        updated += 1;
      } else {
        await ctx.db.insert("datasetSources", source);
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

/** Source inventory with record/chunk counts for the settings page. */
export const sources = query({
  args: {},
  returns: v.array(schema.doc("datasetSources")),
  handler: async (ctx) => {
    return await ctx.db.query("datasetSources").take(100);
  },
});

/** Keyword-only retrieval — always available, even without a query embedding. */
export const keywordSearch = query({
  args: {
    query: v.string(),
    sourceTag: v.optional(ragSourceTag),
    lang: v.optional(ragLang),
    limit: v.optional(v.number()),
  },
  returns: v.array(chunkResult),
  handler: async (ctx, args) => {
    const text = args.query.trim();
    if (text.length < 2) return [];
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 50);
    const hits = await ctx.db
      .query("ragChunks")
      .withSearchIndex("search_text", (q) => {
        const base = q.search("text", text);
        return args.sourceTag ? base.eq("sourceTag", args.sourceTag) : base;
      })
      .take(limit);
    return hits
      .filter((hit) => !args.lang || hit.lang === args.lang)
      .map((hit) => ({
        id: hit._id,
        text: hit.text,
        source: hit.source,
        sourceTag: hit.sourceTag,
        section: hit.section,
        page: hit.page,
        lang: hit.lang,
        url: hit.url,
        score: 1,
      }));
  },
});

export const getChunks = internalQuery({
  args: { ids: v.array(v.id("ragChunks")) },
  returns: v.array(schema.doc("ragChunks")),
  handler: async (ctx, args) => {
    const rows = [];
    for (const id of args.ids.slice(0, 50)) {
      const row = await ctx.db.get(id);
      if (row) rows.push(row);
    }
    return rows;
  },
});

type ChunkResult = {
  id: Id<"ragChunks">;
  text: string;
  source: string;
  sourceTag: Doc<"ragChunks">["sourceTag"];
  section?: string;
  page?: number;
  lang: Doc<"ragChunks">["lang"];
  url?: string;
  score: number;
};

/**
 * Hybrid search: vector similarity when a query embedding is supplied,
 * always merged with keyword matches. The client embeds the query locally.
 */
export const search = action({
  args: {
    query: v.string(),
    queryEmbedding: v.optional(v.array(v.float64())),
    sourceTag: v.optional(ragSourceTag),
    lang: v.optional(ragLang),
    limit: v.optional(v.number()),
  },
  returns: v.array(chunkResult),
  handler: async (ctx, args): Promise<ChunkResult[]> => {
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 30);
    const merged = new Map<string, ChunkResult>();

    const keywordHits = args.query.trim()
      ? await ctx.runQuery(api.rag.keywordSearch, {
          query: args.query,
          sourceTag: args.sourceTag,
          lang: args.lang,
          limit,
        })
      : [];
    keywordHits.forEach((hit, index) => {
      merged.set(hit.id, {
        ...hit,
        score: 0.5 + (1 - index / Math.max(keywordHits.length, 1)) * 0.3,
      });
    });

    const embedding = args.queryEmbedding;
    if (embedding && embedding.length === EMBEDDING_DIMENSIONS) {
      const sourceTag = args.sourceTag;
      const vectorHits = await ctx.vectorSearch("ragChunks", "by_embedding", {
        vector: embedding,
        limit: Math.min(limit * 2, 40),
        ...(sourceTag
          ? { filter: (q) => q.eq("sourceTag", sourceTag) }
          : {}),
      });
      const ids = vectorHits.map((hit) => hit._id);
      const rows = await ctx.runQuery(internal.rag.getChunks, { ids });
      const byId = new Map(rows.map((row) => [row._id as string, row]));
      for (const hit of vectorHits) {
        const row = byId.get(hit._id);
        if (!row) continue;
        if (args.lang && row.lang !== args.lang) continue;
        const existing = merged.get(hit._id);
        const score = 0.5 + hit._score * 0.5;
        if (existing) {
          existing.score = Math.max(existing.score, score) + 0.05;
        } else {
          merged.set(hit._id, {
            id: row._id,
            text: row.text,
            source: row.source,
            sourceTag: row.sourceTag,
            section: row.section,
            page: row.page,
            lang: row.lang,
            url: row.url,
            score,
          });
        }
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
});
