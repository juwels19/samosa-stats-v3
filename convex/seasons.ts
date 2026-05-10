import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { getCurrentUser } from "./users";

const seasonValidator = v.object({
  _id: v.id("seasons"),
  _creationTime: v.number(),
  year: v.number(),
  gameName: v.string(),
  isActive: v.boolean(),
});

export const active = query({
  args: {},
  returns: v.union(seasonValidator, v.null()),
  handler: async (ctx) => {
    return await getActiveSeason(ctx);
  },
});

export const list = query({
  args: {},
  returns: v.array(seasonValidator),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can view seasons.");
    }

    return await ctx.db
      .query("seasons")
      .withIndex("byYear")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    year: v.number(),
    gameName: v.string(),
  },
  returns: v.id("seasons"),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can create seasons.");
    }

    const existingSeason = await ctx.db
      .query("seasons")
      .withIndex("byYear", (q) => q.eq("year", args.year))
      .unique();

    if (existingSeason !== null) {
      throw new Error(`Season ${args.year} already exists.`);
    }

    return await ctx.db.insert("seasons", { ...args, isActive: false });
  },
});

export const setActive = mutation({
  args: {
    seasonId: v.id("seasons"),
  },
  returns: v.id("seasons"),
  async handler(ctx, { seasonId }) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can update the active season.");
    }

    const season = await ctx.db.get(seasonId);

    if (season === null) {
      throw new Error("Season not found.");
    }

    const activeSeasons = await ctx.db
      .query("seasons")
      .withIndex("byIsActive", (q) => q.eq("isActive", true))
      .collect();

    for (const activeSeason of activeSeasons) {
      if (activeSeason._id !== seasonId) {
        await ctx.db.patch(activeSeason._id, { isActive: false });
      }
    }

    if (!season.isActive) {
      await ctx.db.patch(seasonId, { isActive: true });
    }

    return seasonId;
  },
});

async function getActiveSeason(ctx: QueryCtx) {
  const currentUser = await getCurrentUser(ctx);

  if (!currentUser?.isAdmin) {
    return null;
  }

  return await ctx.db
    .query("seasons")
    .withIndex("byIsActive", (q) => q.eq("isActive", true))
    .first();
}
