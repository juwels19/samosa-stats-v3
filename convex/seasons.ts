import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

export const active = query({
  args: {},
  handler: async (ctx) => {
    return await getActiveSeason(ctx);
  }
})

export const create = mutation({
  args: {
    year: v.number(),
    gameName: v.string(),
    isActive: v.boolean()
  },
  async handler(ctx, args) {
    return await ctx.db.insert('seasons', { ...args })
  },
})

async function getActiveSeason(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await ctx.db.query('seasons').filter((q) => q.eq(q.field('isActive'), true)).collect();
}