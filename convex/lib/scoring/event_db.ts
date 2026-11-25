import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

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
  return winnerSource.type === "manual"
    ? result.type === "manual"
    : result.type === "config" || result.type === "error";
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
