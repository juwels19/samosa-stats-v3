import type { Doc, Id } from "../../../_generated/dataModel";
import type { QueryCtx } from "../../../_generated/server";
import { getDataEventCode } from "../../events/data";
import { getCategoryValues } from "../category_values";
import { getEventCategories, getEventResultsRow, getEventTeams, resultMatchesSource } from "../event_db";
import { getGlobalValueInputs } from "../global_value";
import type { ScriptContextData } from "./contract";

/**
 * The read-only data a category's script gets at an event: teams, every
 * submission, every category with its picks and winners, event values and
 * awards. See `ScriptContextData`.
 */
export async function loadScriptContext(
  ctx: QueryCtx,
  event: Doc<"events">,
  category: Doc<"categories">,
): Promise<ScriptContextData> {
  const [season, categories, teams, picks, winnerRows, resultsRow] = await Promise.all([
    ctx.db.get(event.season),
    getEventCategories(ctx, event),
    getEventTeams(ctx, event._id),
    ctx.db.query("picks").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
    ctx.db.query("categoryWinners").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
    getEventResultsRow(ctx, event._id),
  ]);
  if (season === null) throw new Error("The event's season was not found.");

  const categoriesById = new Map(categories.map((row) => [row._id, row]));
  const chosenIds = categories.filter((row) => !row.isGlobal).map((row) => row._id);
  const chosenIdSet = new Set<Id<"categories">>(chosenIds);

  const submissions = await Promise.all(
    picks.map(async (pick) => {
      const [user, pickTeams] = await Promise.all([
        ctx.db.get(pick.user),
        ctx.db.query("pickTeams").withIndex("byPick", (q) => q.eq("pick", pick._id)).collect(),
      ]);
      const teamDocs = await Promise.all(pickTeams.map((row) => ctx.db.get(row.team)));
      return {
        name:
          pick.displayName?.trim() ||
          (user === null ? "Unknown player" : `${user.firstName} ${user.lastName}`.trim()),
        teams: teamDocs
          .filter((team) => team !== null)
          .map((team) => Number(team.number))
          .toSorted((a, b) => a - b),
        // A pick can hold a category the event no longer offers, and stores the global ones too.
        categories: pick.categories.filter((id) => chosenIdSet.has(id)),
      };
    }),
  );

  const { values } = getCategoryValues({
    categoryIds: chosenIds,
    submissions: submissions.map((row) => ({ categoryIds: row.categories })),
  });
  const inputs = getGlobalValueInputs({
    chosenCategoryIds: chosenIds,
    submissions: submissions.map((row) => ({ categoryIds: row.categories, teams: row.teams })),
  });

  const winnersByCategory = new Map<Id<"categories">, number[]>();
  for (const row of winnerRows) {
    const rowCategory = categoriesById.get(row.category);
    if (
      rowCategory !== undefined &&
      resultMatchesSource(row.result, rowCategory.winnerSource) &&
      row.result.type !== "error"
    ) {
      winnersByCategory.set(row.category, row.result.winners);
    }
  }

  const teamPickCounts = new Map<number, number>();
  for (const submission of submissions) {
    for (const team of new Set(submission.teams)) {
      teamPickCounts.set(team, (teamPickCounts.get(team) ?? 0) + 1);
    }
  }
  const eventCode = getDataEventCode(event).toLowerCase();

  return {
    event: {
      key: `${season.year}${eventCode}`,
      year: season.year,
      code: eventCode,
      name: event.name,
    },
    category: { id: category._id, text: category.text, isGlobal: category.isGlobal },
    teams: teams.toSorted((a, b) => a.number - b.number),
    submissions,
    categories: categories.map((row) => {
      const value = values.get(row._id);
      return {
        id: row._id,
        text: row.text,
        isGlobal: row.isGlobal,
        picks: row.isGlobal ? null : (value?.picks ?? 0),
        baseValue: row.isGlobal ? null : (value?.baseValue ?? 1),
        winners: row._id === category._id ? null : (winnersByCategory.get(row._id) ?? null),
      };
    }),
    values: {
      maxCategoryValue: inputs.maxCategoryValue,
      minCategoryValue: inputs.minCategoryValue,
      topTeamValue: inputs.topTeamValue,
      submissions: inputs.submissions,
      categoryValues: inputs.categoryValues,
      teamPicks: [...teamPickCounts]
        .map(([team, count]) => ({ team, picks: count }))
        .toSorted((a, b) => b.picks - a.picks || a.team - b.team),
    },
    awards: resultsRow?.awards?.rows ?? null,
  };
}
