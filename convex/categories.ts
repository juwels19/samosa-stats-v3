import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./users";
import { categoryValidator, seasonValidator } from "./lib/events/validators";
import { findUnknownFields } from "./lib/scoring/field_paths";
import { winnerSourceValidator } from "./lib/scoring/validators";
import { winnerConfigSchema } from "./lib/scoring/winner_config";

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

    if (scoringDescription.length > MAX_SCORING_LENGTH) {
      throw new Error(`Scoring description must be ${MAX_SCORING_LENGTH} characters or fewer.`);
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

/** One category with its season, for the scoring setup page. */
export const get = query({
  args: { categoryId: v.string() },
  returns: v.union(
    v.object({
      category: categoryValidator,
      season: seasonValidator,
      /** The latest finished event of the season, for previews. */
      exampleEventCode: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can view categories.");
    }

    const categoryId = ctx.db.normalizeId("categories", args.categoryId);
    const category = categoryId === null ? null : await ctx.db.get(categoryId);
    if (category === null) {
      return null;
    }

    const season = await ctx.db.get(category.season);
    if (season === null) {
      throw new Error("The category's season was not found.");
    }

    const events = await ctx.db
      .query("events")
      .withIndex("bySeason", (q) => q.eq("season", season._id))
      .collect();
    const latest = events
      .filter((event) => event.status === "COMPLETE")
      .toSorted((a, b) => b.endDate.localeCompare(a.endDate))[0];

    return {
      category,
      season,
      exampleEventCode: latest ? latest.eventCode.toLowerCase() : null,
    };
  },
});

/**
 * Sets how a category finds its winners. A config is checked against the
 * schema and against the fields its sources have in the category's season.
 */
export const setWinnerSource = mutation({
  args: {
    categoryId: v.id("categories"),
    winnerSource: winnerSourceValidator,
  },
  returns: v.null(),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can change category scoring.");
    }

    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      throw new Error("Category not found.");
    }

    if (args.winnerSource.type === "manual") {
      await ctx.db.patch(args.categoryId, { winnerSource: { type: "manual" } });
      return null;
    }

    const season = await ctx.db.get(category.season);
    if (season === null) {
      throw new Error("The category's season was not found.");
    }

    const parsed = winnerConfigSchema.safeParse(args.winnerSource.config);
    if (!parsed.success) {
      throw new Error(
        `The scoring config is not valid: ${parsed.error.issues
          .map((issue) => issue.message)
          .join(" ")}`,
      );
    }

    const unknownFields = findUnknownFields(parsed.data, season.year);
    if (unknownFields.length > 0) {
      throw new Error(
        `These fields do not exist in ${season.year}: ${unknownFields
          .map((issue) => `${issue.field} (${issue.measure})`)
          .join(", ")}.`,
      );
    }

    await ctx.db.patch(args.categoryId, {
      winnerSource: { type: "config", config: parsed.data },
    });
    return null;
  },
});

const MAX_TEXT_LENGTH = 150;
const MAX_SCORING_LENGTH = 500;
const MAX_BULK_CATEGORIES = 200;

/** Changes a category's scoring description. Empty removes it. */
export const updateDescription = mutation({
  args: {
    categoryId: v.id("categories"),
    scoringDescription: v.string(),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can change categories.");
    }
    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      throw new Error("Category not found.");
    }
    const scoringDescription = args.scoringDescription.trim();
    if (scoringDescription.length > MAX_SCORING_LENGTH) {
      throw new Error(`Scoring description must be ${MAX_SCORING_LENGTH} characters or fewer.`);
    }
    await ctx.db.patch(category._id, { scoringDescription });
    return null;
  },
});

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
      if (scoringDescription.length > MAX_SCORING_LENGTH) {
        throw new Error(
          `Row ${row}: scoring description must be ${MAX_SCORING_LENGTH} characters or fewer.`,
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
