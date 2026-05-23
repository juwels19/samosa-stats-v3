import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { getActiveSeason } from "../events/data";
import { normalizeEventCode } from "../events/normalize_event_code";
import { sortCategoriesByText } from "../events/sort";
import { splitEventCategories } from "./split_event_categories";

export async function getEventSubmissionData(
  ctx: QueryCtx | MutationCtx,
  {
    eventCode,
    userId,
  }: {
    eventCode: string;
    userId: Id<"users">;
  },
) {
  const event = await getEventByCode(ctx, eventCode);

  if (event === null) {
    return null;
  }

  const [teams, eventCategories, existingPick] = await Promise.all([
    getTeamsForEvent(ctx, event._id),
    getCategoriesForEvent(ctx, event.categories),
    getExistingPickForEvent(ctx, {
      eventId: event._id,
      userId,
      eventCategoryIds: event.categories,
    }),
  ]);
  const { selectableCategories } = splitEventCategories(eventCategories);

  return {
    event: {
      _id: event._id,
      _creationTime: event._creationTime,
      name: event.name,
      displayName: event.displayName,
      eventCode: event.eventCode,
      startDate: event.startDate,
      endDate: event.endDate,
      numberOfTeamPicks: event.numberOfTeamPicks,
      numberOfCategoryPicks: event.numberOfCategoryPicks,
      status: event.status,
    },
    teams,
    categories: selectableCategories,
    existingPick,
    canSubmitManual: event.status === "SUBMISSIONS_OPEN",
    canSubmitRandom:
      event.status === "SUBMISSIONS_OPEN" ||
      event.status === "SUBMISSIONS_CLOSED",
  };
}

async function getEventByCode(ctx: QueryCtx | MutationCtx, eventCode: string) {
  const activeSeason = await getActiveSeason(ctx);

  if (activeSeason === null) {
    return null;
  }

  return await ctx.db
    .query("events")
    .withIndex("bySeasonAndEventCode", (q) =>
      q
        .eq("season", activeSeason._id)
        .eq("eventCode", normalizeEventCode(eventCode)),
    )
    .unique();
}

async function getTeamsForEvent(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
) {
  const eventTeams = await ctx.db
    .query("eventTeams")
    .withIndex("byEvent", (q) => q.eq("event", eventId))
    .collect();
  const teams = await Promise.all(
    eventTeams.map(async (eventTeam) => await ctx.db.get(eventTeam.team)),
  );

  return teams
    .filter((team): team is Doc<"teams"> => team !== null)
    .toSorted((a, b) => {
      if (a.number === b.number) {
        return a.name.localeCompare(b.name);
      }

      return a.number < b.number ? -1 : 1;
    });
}

export async function getGlobalCategoryIdsForEvent(
  ctx: QueryCtx | MutationCtx,
  eventCategoryIds: Id<"categories">[],
) {
  const eventCategories = await getCategoriesForEvent(ctx, eventCategoryIds);

  return splitEventCategories(eventCategories).globalCategories.map(
    (category) => category._id,
  );
}

async function getCategoriesForEvent(
  ctx: QueryCtx | MutationCtx,
  categoryIds: Id<"categories">[],
) {
  const categories = await Promise.all(
    categoryIds.map(async (categoryId) => await ctx.db.get(categoryId)),
  );

  return sortCategoriesByText(
    categories.filter(
      (category): category is Doc<"categories"> => category !== null,
    ),
  );
}

async function getExistingPickForEvent(
  ctx: QueryCtx | MutationCtx,
  {
    eventId,
    userId,
    eventCategoryIds,
  }: {
    eventId: Id<"events">;
    userId: Id<"users">;
    eventCategoryIds: Id<"categories">[];
  },
) {
  const eventCategories = await getCategoriesForEvent(ctx, eventCategoryIds);
  const selectableCategoryIds = new Set(
    eventCategories
      .filter((category) => !category.isGlobal)
      .map((category) => category._id),
  );
  const pick = await ctx.db
    .query("picks")
    .withIndex("byUserAndEvent", (q) =>
      q.eq("user", userId).eq("event", eventId),
    )
    .unique();

  if (pick === null) {
    return null;
  }

  const [pickTeams, pickCategories] = await Promise.all([
    ctx.db
      .query("pickTeams")
      .withIndex("byPick", (q) => q.eq("pick", pick._id))
      .collect(),
    ctx.db
      .query("pickCategories")
      .withIndex("byPick", (q) => q.eq("pick", pick._id))
      .collect(),
  ]);

  return {
    _id: pick._id,
    _creationTime: pick._creationTime,
    displayName: pick.displayName,
    isRandom: pick.isRandom,
    selectedTeamIds: pickTeams.map((pickTeam) => pickTeam.team),
    selectedCategoryIds: (
      pickCategories.length > 0
        ? pickCategories.map((pickCategory) => pickCategory.category)
        : pick.categories
    ).filter((categoryId) => selectableCategoryIds.has(categoryId)),
  };
}
