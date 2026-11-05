import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id as any);
  },
});

export const getByKey = query({
  args: {
    table: v.string(),
    index: v.string(),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query(args.table as any)
      .withIndex(args.index as any, (q: any) => q.eq(args.field, args.value))
      .unique();
  },
});

export const find = query({
  args: {
    table: v.string(),
    index: v.optional(v.string()),
    field: v.optional(v.string()),
    value: v.optional(v.any()),
    field2: v.optional(v.string()),
    value2: v.optional(v.any()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query(args.table as any);
    if (args.index && args.field && args.value !== undefined) {
      q = q.withIndex(args.index as any, (idx: any) => {
        let cond = idx.eq(args.field, args.value);
        if (args.field2 && args.value2 !== undefined) {
          cond = cond.eq(args.field2, args.value2);
        }
        return cond;
      });
    }
    if (args.order) {
      q = q.order(args.order);
    }
    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

export const count = query({
  args: {
    table: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query(args.table as any).collect();
    return rows.length;
  },
});

export const insert = mutation({
  args: {
    table: v.string(),
    doc: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert(args.table as any, args.doc);
  },
});

export const patch = mutation({
  args: {
    id: v.string(),
    doc: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id as any, args.doc);
    return { ok: true };
  },
});

export const remove = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id as any);
    return { ok: true };
  },
});

export const searchFoods = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    if (!args.q.trim()) {
      return await ctx.db.query("foods").take(limit);
    }
    return await ctx.db
      .query("foods")
      .withSearchIndex("search_name_en", (q) => q.search("nameEn", args.q))
      .take(limit);
  },
});
