import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { evaluateGlobalValue, type GlobalValueInputs } from "./global_value";

/** Database helpers that event scoring and event results share. */

export async function getEventCategories(ctx: QueryCtx, event: Doc<"events">) {
  const categories = await Promise.all(
    event.categories.map((categoryId) => ctx.db.get(categoryId)),
  );
  return categories.filter((category) => category !== null);
}

export async function getEventTeams(ctx: QueryCtx, eventId: Id<"events">) {
  const eventTeams = await ctx.db
    .query("eventTeams")
    .withIndex("byEvent", (q) => q.eq("event", eventId))
    .collect();
  const teams = await Promise.all(
    eventTeams.map((eventTeam) => ctx.db.get(eventTeam.team)),
  );
  return teams
    .filter((team) => team !== null)
    .map((team) => ({ number: Number(team.number), name: team.name }));
}

export async function getCategoryWinnersRow(
  ctx: QueryCtx,
  eventId: Id<"events">,
  categoryId: Id<"categories">,
) {
  return await ctx.db
    .query("categoryWinners")
    .withIndex("byEventAndCategory", (q) =>
      q.eq("event", eventId).eq("category", categoryId),
    )
    .unique();
}

export async function upsertCategoryWinners(
  ctx: MutationCtx,
  eventId: Id<"events">,
  categoryId: Id<"categories">,
  result: Doc<"categoryWinners">["result"],
) {
  const existing = await getCategoryWinnersRow(ctx, eventId, categoryId);
  if (existing === null) {
    await ctx.db.insert("categoryWinners", {
      event: eventId,
      category: categoryId,
      result,
    });
  } else {
    await ctx.db.patch(existing._id, { result });
  }
}

/** A saved result counts only while the category keeps the same source. */
export function resultMatchesSource(
  result: Doc<"categoryWinners">["result"] | null,
  winnerSource: Doc<"categories">["winnerSource"],
) {
  if (result === null || winnerSource === undefined) {
    return false;
  }
  switch (winnerSource.type) {
    case "manual":
      return result.type === "manual";
    case "config":
      return result.type === "config" || result.type === "error";
    case "script":
      return result.type === "script" || result.type === "error";
    case "leastUnique":
      // Found from the picks each time. Nothing is saved.
      return false;
  }
}

/** "final" once an admin finalizes the results. Draft until then. */
export async function getResultsStatus(ctx: QueryCtx, eventId: Id<"events">) {
  const row = await getEventResultsRow(ctx, eventId);
  return row?.status ?? "draft";
}

export async function getEventResultsRow(ctx: QueryCtx, eventId: Id<"events">) {
  return await ctx.db
    .query("eventResults")
    .withIndex("byEvent", (q) => q.eq("event", eventId))
    .unique();
}

export async function assertResultsNotFinal(ctx: QueryCtx, eventId: Id<"events">) {
  if ((await getResultsStatus(ctx, eventId)) === "final") {
    throw new Error("The results are final. Reopen them to change winners.");
  }
}

/**
 * Each global category's value at an event, keyed by category, rounded down.
 * The value comes from the category's script points when `pointsSource` is
 * "script", or from its value formula. Null when there is no value.
 */
export function getGlobalCategoryValues(
  categories: readonly Doc<"categories">[],
  inputs: GlobalValueInputs,
  scriptPoints: ReadonlyMap<Id<"categories">, number | null> = new Map(),
): Map<Id<"categories">, number | null> {
  return new Map(
    categories
      .filter((category) => category.isGlobal)
      .map((category) => {
        // Each team has its own points, set with the winners. See `teamPoints` in event scores.
        if (category.pointsSource === "manual") return [category._id, 0];
        if (category.pointsSource === "script") {
          const points = scriptPoints.get(category._id) ?? null;
          return [category._id, points === null ? null : Math.floor(points)];
        }
        return [category._id, evaluateGlobalValue(category.valueFormula, inputs)];
      }),
  );
}

/** The saved script points rows of an event, keyed by category. */
export async function getCategoryPointsRows(ctx: QueryCtx, eventId: Id<"events">) {
  const rows = await ctx.db
    .query("categoryPoints")
    .withIndex("byEvent", (q) => q.eq("event", eventId))
    .collect();
  return new Map(rows.map((row) => [row.category, row.result]));
}

/** The points of each script points result. Errors give no points. */
export function getScriptPoints(
  rows: ReadonlyMap<Id<"categories">, Doc<"categoryPoints">["result"]>,
): Map<Id<"categories">, number | null> {
  return new Map(
    [...rows].map(([categoryId, result]) => [
      categoryId,
      result.type === "script" ? result.points : null,
    ]),
  );
}

export async function upsertCategoryPoints(
  ctx: MutationCtx,
  eventId: Id<"events">,
  categoryId: Id<"categories">,
  result: Doc<"categoryPoints">["result"],
) {
  const existing = await ctx.db
    .query("categoryPoints")
    .withIndex("byEventAndCategory", (q) => q.eq("event", eventId).eq("category", categoryId))
    .unique();
  if (existing === null) {
    await ctx.db.insert("categoryPoints", { event: eventId, category: categoryId, result });
  } else {
    await ctx.db.patch(existing._id, { result });
  }
}

/**
 * Each team's points for the global categories whose points an admin sets,
 * keyed by category. Only manual results count.
 */
export function getManualTeamPoints(
  categories: readonly Doc<"categories">[],
  results: ReadonlyMap<Id<"categories">, Doc<"categoryWinners">["result"]>,
): Map<Id<"categories">, Map<number, number>> {
  const points = new Map<Id<"categories">, Map<number, number>>();
  for (const category of categories) {
    if (!category.isGlobal || category.pointsSource !== "manual") continue;
    const result = results.get(category._id);
    const rows = result?.type === "manual" ? (result.teamPoints ?? []) : [];
    points.set(category._id, new Map(rows.map((row) => [row.team, row.points])));
  }
  return points;
}
