import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_KEY = "default";

/** Consent receipt log. */
export const recordConsent = mutation({
  args: {
    key: v.optional(v.string()),
    accepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const now = Date.now();
    await ctx.db.insert("auditLogs", {
      profileKey: key,
      action: args.accepted ? "consent.accept" : "consent.reject",
      at: now,
    });
    return { ok: true };
  },
});

/**
 * Delete all user data for a profile key (FR-J consent / delete-my-data).
 * No auth yet — demo key. Production must authorize via Convex Auth.
 */
export const deleteMyData = mutation({
  args: {
    key: v.optional(v.string()),
    confirm: v.literal("DELETE"),
  },
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    const now = Date.now();
    let deleted = 0;

    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", key))
      .collect();
    for (const p of profiles) {
      await ctx.db.delete(p._id);
      deleted++;
    }

    const meals = await ctx.db
      .query("mealLogs")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .collect();
    for (const m of meals) {
      await ctx.db.delete(m._id);
      deleted++;
    }

    const acts = await ctx.db
      .query("activityLogs")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .collect();
    for (const a of acts) {
      await ctx.db.delete(a._id);
      deleted++;
    }

    const budgets = await ctx.db
      .query("budgetState")
      .withIndex("by_profile_and_week", (q) => q.eq("profileKey", key))
      .collect();
    for (const b of budgets) {
      await ctx.db.delete(b._id);
      deleted++;
    }

    const weighIns = await ctx.db
      .query("weighIns")
      .withIndex("by_profile_and_date", (q) => q.eq("profileKey", key))
      .collect();
    for (const w of weighIns) {
      await ctx.db.delete(w._id);
      deleted++;
    }

    // Keep a tombstone audit line (no PII)
    await ctx.db.insert("auditLogs", {
      profileKey: key,
      action: "privacy.deleteMyData",
      at: now,
      detail: `removed=${deleted}`,
    });

    return { ok: true, deleted };
  },
});

export const auditTrail = query({
  args: { key: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = args.key ?? DEFAULT_KEY;
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_profile", (q) => q.eq("profileKey", key))
      .order("desc")
      .take(50);
  },
});
