import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
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

const eventValidator = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  name: v.string(),
  displayName: v.string(),
  season: v.id("seasons"),
  eventCode: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  numberOfTeamPicks: v.int64(),
  numberOfCategoryPicks: v.int64(),
  categories: v.array(v.id("categories")),
  status: v.union(
    v.literal("UPCOMING"),
    v.literal("SUBMISSIONS_OPEN"),
    v.literal("SUBMISSIONS_CLOSED"),
    v.literal("ONGOING"),
    v.literal("COMPLETE"),
  ),
});

export const list = query({
  args: {},
  returns: v.object({
    activeSeason: v.union(seasonValidator, v.null()),
    globalCategories: v.array(categoryValidator),
    seasonCategories: v.array(categoryValidator),
    events: v.array(eventValidator),
  }),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can view events.");
    }

    const activeSeason = await getActiveSeason(ctx);

    if (activeSeason === null) {
      return {
        activeSeason,
        globalCategories: [],
        seasonCategories: [],
        events: [],
      };
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("bySeason", (q) => q.eq("season", activeSeason._id))
      .collect();
    const events = await ctx.db
      .query("events")
      .withIndex("bySeason", (q) => q.eq("season", activeSeason._id))
      .collect();

    return {
      activeSeason,
      globalCategories: sortCategoriesByText(
        categories.filter((category) => category.isGlobal),
      ),
      seasonCategories: sortCategoriesByText(
        categories.filter((category) => !category.isGlobal),
      ),
      events: sortEventsByStartDate(events),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    eventCode: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    numberOfTeamPicks: v.int64(),
    numberOfCategoryPicks: v.int64(),
    categories: v.array(v.id("categories")),
  },
  returns: v.id("events"),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can create events.");
    }

    const activeSeason = await getActiveSeason(ctx);

    if (activeSeason === null) {
      throw new Error("Choose an active season before adding events.");
    }

    const name = args.name.trim();
    const displayName = args.displayName.trim();
    const eventCode = normalizeEventCode(args.eventCode);
    const startDate = args.startDate.trim();
    const endDate = args.endDate.trim();

    validateEventFields({
      name,
      displayName,
      eventCode,
      startDate,
      endDate,
      numberOfTeamPicks: args.numberOfTeamPicks,
      numberOfCategoryPicks: args.numberOfCategoryPicks,
      categories: args.categories,
    });

    await assertEventDoesNotExistForSeason(ctx, eventCode, activeSeason._id);
    await assertCategoriesBelongToSeason(ctx, args.categories, activeSeason._id);

    return await ctx.db.insert("events", {
      name,
      displayName,
      season: activeSeason._id,
      eventCode,
      startDate,
      endDate,
      numberOfTeamPicks: args.numberOfTeamPicks,
      numberOfCategoryPicks: args.numberOfCategoryPicks,
      categories: args.categories,
      status: "UPCOMING",
    });
  },
});

async function getActiveSeason(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("seasons")
    .withIndex("byIsActive", (q) => q.eq("isActive", true))
    .first();
}

async function assertEventDoesNotExistForSeason(
  ctx: MutationCtx,
  eventCode: string,
  seasonId: Id<"seasons">,
) {
  const existingEvent = await ctx.db
    .query("events")
    .withIndex("bySeasonAndEventCode", (q) =>
      q.eq("season", seasonId).eq("eventCode", eventCode),
    )
    .unique();

  if (existingEvent !== null) {
    throw new Error(`Event "${eventCode}" already exists for the active season.`);
  }
}

async function assertCategoriesBelongToSeason(
  ctx: MutationCtx,
  categoryIds: Id<"categories">[],
  seasonId: Id<"seasons">,
) {
  const uniqueCategoryIds = new Set(categoryIds);

  if (uniqueCategoryIds.size !== categoryIds.length) {
    throw new Error("Selected categories must be unique.");
  }

  for (const categoryId of uniqueCategoryIds) {
    const category = await ctx.db.get(categoryId);

    if (category === null || category.season !== seasonId) {
      throw new Error("Selected categories must belong to the active season.");
    }
  }
}

function validateEventFields({
  name,
  displayName,
  eventCode,
  startDate,
  endDate,
  numberOfTeamPicks,
  numberOfCategoryPicks,
  categories,
}: {
  name: string;
  displayName: string;
  eventCode: string;
  startDate: string;
  endDate: string;
  numberOfTeamPicks: bigint;
  numberOfCategoryPicks: bigint;
  categories: Id<"categories">[];
}) {
  if (name.length === 0) {
    throw new Error("Official event name is required.");
  }

  if (displayName.length === 0) {
    throw new Error("Display name is required.");
  }

  if (eventCode.length === 0) {
    throw new Error("Event code is required.");
  }

  if (startDate.length === 0 || endDate.length === 0) {
    throw new Error("Event dates are required.");
  }

  if (numberOfTeamPicks <= BigInt(0)) {
    throw new Error("Number of team picks must be greater than zero.");
  }

  if (numberOfCategoryPicks <= BigInt(0)) {
    throw new Error("Number of category picks must be greater than zero.");
  }

  if (categories.length === 0) {
    throw new Error("Select at least one category.");
  }
}

function normalizeEventCode(eventCode: string) {
  return eventCode.trim().toUpperCase();
}

function sortCategoriesByText<TCategory extends { text: string }>(
  categories: TCategory[],
) {
  return categories.toSorted((a, b) => a.text.localeCompare(b.text));
}

function sortEventsByStartDate<TEvent extends { startDate: string }>(
  events: TEvent[],
) {
  return events.toSorted((a, b) => a.startDate.localeCompare(b.startDate));
}
