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

const MAX_TEXT_LENGTH = 150;
const MAX_SCORING_LENGTH = 500;
const MAX_BULK_CATEGORIES = 200;

/** Adds many categories to the active season. Saves all of them or none. */
export const createMany = mutation({
  args: {
    categories: v.array(
      v.object({
        text: v.string(),
        scoringDescription: v.string(),
        isGlobal: v.boolean(),
      }),
    ),
  },
  returns: v.number(),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can create categories.");
    }

    if (args.categories.length === 0) {
      throw new Error("Add at least one category.");
    }

    if (args.categories.length > MAX_BULK_CATEGORIES) {
      throw new Error(`Import ${MAX_BULK_CATEGORIES} categories or fewer at a time.`);
    }

    const activeSeason = await getActiveSeason(ctx);

    if (activeSeason === null) {
      throw new Error("Create an active season before adding categories.");
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("bySeason", (q) => q.eq("season", activeSeason._id))
      .collect();
    const seen = new Set(existing.map((category) => normalizeCategoryText(category.text)));

    const rows = args.categories.map((category, index) => {
      const text = category.text.trim();
      const scoringDescription = category.scoringDescription.trim();
      const row = index + 1;

      if (text.length === 0 || text.length > MAX_TEXT_LENGTH) {
        throw new Error(`Row ${row}: category text must be 1 to ${MAX_TEXT_LENGTH} characters.`);
      }
      if (scoringDescription.length === 0 || scoringDescription.length > MAX_SCORING_LENGTH) {
        throw new Error(
          `Row ${row}: scoring description must be 1 to ${MAX_SCORING_LENGTH} characters.`,
        );
      }
      const key = normalizeCategoryText(text);
      if (seen.has(key)) {
        throw new Error(`Row ${row}: category "${text}" already exists.`);
      }
      seen.add(key);

      return { text, scoringDescription, isGlobal: category.isGlobal };
    });

    for (const row of rows) {
      await ctx.db.insert("categories", { ...row, season: activeSeason._id });
    }

    return rows.length;
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
