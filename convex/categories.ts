import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./users";

const seasonValidator = v.object({
  _id: v.id("seasons"),
  _creationTime: v.number(),
  year: v.number(),
  gameName: v.string(),
  isActive: v.boolean(),
});

const categoryValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  text: v.string(),
  scoringDescription: v.string(),
  season: v.id("seasons"),
  isGlobal: v.boolean(),
});

export const list = query({
  args: {},
  returns: v.object({
    activeSeason: v.union(seasonValidator, v.null()),
    globalCategories: v.array(categoryValidator),
    seasonCategories: v.array(categoryValidator),
  }),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can view categories.");
    }

    const activeSeason = await getActiveSeason(ctx);
    const categories =
      activeSeason === null
        ? []
        : await ctx.db
            .query("categories")
            .withIndex("bySeason", (q) => q.eq("season", activeSeason._id))
            .collect();
    const globalCategories = categories.filter((category) => category.isGlobal);
    const seasonCategories = categories.filter((category) => !category.isGlobal);

    return {
      activeSeason,
      globalCategories: sortCategoriesByText(globalCategories),
      seasonCategories: sortCategoriesByText(seasonCategories),
    };
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    scoringDescription: v.string(),
    isGlobal: v.boolean(),
  },
  returns: v.id("categories"),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can create categories.");
    }

    const text = args.text.trim();
    const scoringDescription = args.scoringDescription?.trim();

    if (text.length === 0) {
      throw new Error("Category text is required.");
    }

    if (scoringDescription.length === 0) {
      throw new Error("Scoring description is required.");
    }

    const activeSeason = await getActiveSeason(ctx);

    if (activeSeason === null) {
      throw new Error("Create an active season before adding categories.");
    }

    await assertCategoryDoesNotExistForSeason(ctx, text, activeSeason._id);

    return await ctx.db.insert("categories", {
      text,
      scoringDescription,
      isGlobal: args.isGlobal,
      season: activeSeason._id,
    });
  },
});

async function getActiveSeason(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("seasons")
    .withIndex("byIsActive", (q) => q.eq("isActive", true))
    .first();
}

async function assertCategoryDoesNotExistForSeason(
  ctx: MutationCtx,
  text: string,
  seasonId: Id<"seasons">,
) {
  const existingCategories = await ctx.db
    .query("categories")
    .withIndex("bySeason", (q) => q.eq("season", seasonId))
    .collect();

  if (hasCategoryWithText(existingCategories, text)) {
    throw new Error(`Category "${text}" already exists for the active season.`);
  }
}

function hasCategoryWithText(
  categories: Array<{ text: string }>,
  text: string,
) {
  const normalizedText = normalizeCategoryText(text);
  return categories.some(
    (category) => normalizeCategoryText(category.text) === normalizedText,
  );
}

function normalizeCategoryText(text: string) {
  return text.trim().toLowerCase();
}

function sortCategoriesByText<TCategory extends { text: string }>(
  categories: TCategory[],
) {
  return categories.toSorted((a, b) => a.text.localeCompare(b.text));
}
