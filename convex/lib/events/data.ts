import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

export async function getActiveSeason(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("seasons")
    .withIndex("byIsActive", (q) => q.eq("isActive", true))
    .first();
}

export async function assertEventDoesNotExistForSeason(
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

export async function assertCategoriesBelongToSeason(
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

export async function getTeamSyncDetailsForEvent(
  ctx: QueryCtx,
  eventId: Id<"events">,
) {
  const event = await ctx.db.get(eventId);

  if (event === null) {
    throw new Error("Event not found.");
  }

  const season = await ctx.db.get(event.season);

  if (season === null) {
    throw new Error("Event season not found.");
  }

  return {
    eventCode: event.eventCode,
    seasonYear: season.year,
  };
}
