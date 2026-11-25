import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type QueryCtx } from "./_generated/server";
import {
  getEventCategories,
  getEventResultsRow,
  resultMatchesSource,
} from "./lib/scoring/event_db";
import { calculateEventScores } from "./lib/scoring/event_scores";
import { getTbaAwardType } from "./lib/scoring/sources/tba_award_types";
import {
  resultsStatusValidator,
  scoreLineItemValidator,
} from "./lib/scoring/validators";
import { getCurrentUser } from "./users";

/**
 * Event results: the draft or final status, and each submission's score.
 * While draft, scores are calculated live from the current winners. Finalize
 * saves them, so later changes (such as a new deduction award) don't change
 * a final event. See "Event score" in docs/scoring.md.
 */

const scoreValidator = v.object({
  pick: v.id("picks"),
  name: v.string(),
  isMock: v.boolean(),
  teams: v.array(v.number()),
  total: v.number(),
  uniqueness: v.number(),
  lineItems: v.array(scoreLineItemValidator),
});

type EventScoreRow = {
  pick: Id<"picks">;
  user: Id<"users">;
  name: string;
  isMock: boolean;
  teams: number[];
  total: number;
  uniqueness: number;
  lineItems: Doc<"eventScores">["lineItems"];
};

async function requireAdmin(ctx: QueryCtx) {
  const currentUser = await getCurrentUser(ctx);
  if (!currentUser?.isAdmin) {
    throw new Error("Only admins can manage event results.");
  }
  return currentUser;
}

/**
 * Calculates every submission's score from the current picks, winners and
 * awards. `blockers` lists what must be fixed before the results can be final.
 */
async function calculateDraftResults(ctx: QueryCtx, event: Doc<"events">) {
  const [season, categories, picks, winnerRows, resultsRow] = await Promise.all([
    ctx.db.get(event.season),
    getEventCategories(ctx, event),
    ctx.db.query("picks").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
    ctx.db
      .query("categoryWinners")
      .withIndex("byEvent", (q) => q.eq("event", event._id))
      .collect(),
    getEventResultsRow(ctx, event._id),
  ]);
  if (season === null) {
    throw new Error("The event's season was not found.");
  }

  const categoriesById = new Map(categories.map((category) => [category._id, category]));
  const winners = new Map<Id<"categories">, number[]>();
  for (const row of winnerRows) {
    const category = categoriesById.get(row.category);
    if (
      category !== undefined &&
      resultMatchesSource(row.result, category.winnerSource) &&
      row.result.type !== "error"
    ) {
      winners.set(row.category, row.result.winners);
    }
  }

  const deductionAwardType = season.deductionAwardType ?? null;
  const awards = resultsRow?.awards ?? null;
  const awardWinners =
    deductionAwardType === null || awards === null
      ? []
      : [
          ...new Set(
            awards.rows.filter((row) => row.awardType === deductionAwardType).map((row) => row.team),
          ),
        ].toSorted((a, b) => a - b);

  const submissions = await Promise.all(
    picks.map(async (pick) => {
      const [user, pickTeams] = await Promise.all([
        ctx.db.get(pick.user),
        ctx.db.query("pickTeams").withIndex("byPick", (q) => q.eq("pick", pick._id)).collect(),
      ]);
      const teams = await Promise.all(pickTeams.map(async (row) => await ctx.db.get(row.team)));
      return {
        pick,
        name:
          pick.displayName?.trim() ||
          (user === null ? "Unknown player" : `${user.firstName} ${user.lastName}`.trim()),
        isMock: user?.isMock === true,
        teams: teams
          .filter((team) => team !== null)
          .map((team) => Number(team.number))
          .toSorted((a, b) => a - b),
      };
    }),
  );

  // A pick can hold a category the event no longer offers. It gives no points.
  const result = calculateEventScores({
    categoryIds: categories.map((category) => category._id),
    submissions: submissions.map(({ pick, teams }) => ({
      id: pick._id,
      categoryIds: pick.categories.filter((id) => categoriesById.has(id)),
      teams,
    })),
    winners,
    awardWinners,
  });
  const scoreByPick = new Map(result.scores.map((score) => [score.submission, score]));

  const scores: EventScoreRow[] = submissions.map(({ pick, name, isMock, teams }) => {
    const score = scoreByPick.get(pick._id);
    return {
      pick: pick._id,
      user: pick.user,
      name,
      isMock,
      teams,
      total: score?.total ?? 0,
      uniqueness: score?.uniqueness ?? 0,
      lineItems: score?.lineItems ?? [],
    };
  });

  const missingWinners = categories.filter((category) => !winners.has(category._id));
  const blockers = [
    ...(event.status === "COMPLETE" ? [] : ["The event is not complete yet."]),
    ...(deductionAwardType === null
      ? ["Set the deduction award on the Season settings page."]
      : []),
    ...(awards === null ? ["Calculate winners to get the event's awards from TBA."] : []),
    ...(missingWinners.length === 0
      ? []
      : [
          `${missingWinners.length} ${missingWinners.length === 1 ? "category has" : "categories have"} no winners: ${missingWinners
            .map((category) => category.text)
            .join(", ")}.`,
        ]),
  ];

  return {
    scores,
    topCatValue: result.topCatValue,
    topTeamValue: result.topTeamValue,
    deductionAwardType,
    awardWinners,
    awardsFetchedAt: awards?.fetchedAt ?? null,
    blockers,
  };
}

function sortScores<Score extends { total: number; name: string }>(scores: Score[]) {
  return scores.toSorted((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function toDeductionAward(awardType: number | null) {
  if (awardType === null) return null;
  return { type: awardType, name: getTbaAwardType(awardType)?.label ?? `Award type ${awardType}` };
}

export const getEventResults = query({
  args: { eventId: v.id("events") },
  returns: v.object({
    status: resultsStatusValidator,
    finalizedAt: v.union(v.number(), v.null()),
    topCatValue: v.number(),
    topTeamValue: v.number(),
    deductionAward: v.union(v.object({ type: v.number(), name: v.string() }), v.null()),
    awardWinners: v.array(v.number()),
    awardsFetchedAt: v.union(v.number(), v.null()),
    /** What must be fixed before the results can be final. Empty when final. */
    blockers: v.array(v.string()),
    scores: v.array(scoreValidator),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const event = await ctx.db.get(args.eventId);
    if (event === null) {
      throw new Error("Event not found.");
    }

    const resultsRow = await getEventResultsRow(ctx, event._id);
    if (resultsRow?.status === "final" && resultsRow.final !== undefined) {
      const saved = await ctx.db
        .query("eventScores")
        .withIndex("byEvent", (q) => q.eq("event", event._id))
        .collect();
      const users = await Promise.all(saved.map(async (row) => await ctx.db.get(row.user)));
      return {
        status: "final" as const,
        finalizedAt: resultsRow.final.finalizedAt,
        topCatValue: resultsRow.final.topCatValue,
        topTeamValue: resultsRow.final.topTeamValue,
        deductionAward: toDeductionAward(resultsRow.final.deductionAwardType),
        awardWinners: resultsRow.final.awardWinners,
        awardsFetchedAt: resultsRow.awards?.fetchedAt ?? null,
        blockers: [],
        scores: sortScores(
          saved.map((row, index) => ({
            pick: row.pick,
            name: row.name,
            isMock: users[index]?.isMock === true,
            teams: row.teams,
            total: row.total,
            uniqueness: row.uniqueness,
            lineItems: row.lineItems,
          })),
        ),
      };
    }

    const draft = await calculateDraftResults(ctx, event);
    return {
      status: "draft" as const,
      finalizedAt: null,
      topCatValue: draft.topCatValue,
      topTeamValue: draft.topTeamValue,
      deductionAward: toDeductionAward(draft.deductionAwardType),
      awardWinners: draft.awardWinners,
      awardsFetchedAt: draft.awardsFetchedAt,
      blockers: draft.blockers,
      scores: sortScores(draft.scores).map((score) => ({
        pick: score.pick,
        name: score.name,
        isMock: score.isMock,
        teams: score.teams,
        total: score.total,
        uniqueness: score.uniqueness,
        lineItems: score.lineItems,
      })),
    };
  },
});

/** Saves every submission's score and makes the results final. */
export const finalize = mutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);
    const event = await ctx.db.get(args.eventId);
    if (event === null) {
      throw new Error("Event not found.");
    }
    const resultsRow = await getEventResultsRow(ctx, event._id);
    if (resultsRow?.status === "final") {
      throw new Error("The results are already final.");
    }

    const draft = await calculateDraftResults(ctx, event);
    if (draft.blockers.length > 0 || draft.deductionAwardType === null || resultsRow === null) {
      throw new Error(`The results can't be final yet. ${draft.blockers.join(" ")}`);
    }

    for (const score of draft.scores) {
      await ctx.db.insert("eventScores", {
        event: event._id,
        pick: score.pick,
        user: score.user,
        name: score.name,
        teams: score.teams,
        total: score.total,
        uniqueness: score.uniqueness,
        lineItems: score.lineItems,
      });
    }
    await ctx.db.patch(resultsRow._id, {
      status: "final",
      final: {
        finalizedAt: Date.now(),
        finalizedBy: currentUser._id,
        topCatValue: draft.topCatValue,
        topTeamValue: draft.topTeamValue,
        deductionAwardType: draft.deductionAwardType,
        awardWinners: draft.awardWinners,
      },
    });
    return null;
  },
});

/** Makes final results a draft again, so winners can change. */
export const reopen = mutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const resultsRow = await getEventResultsRow(ctx, args.eventId);
    if (resultsRow?.status !== "final") {
      throw new Error("The results are not final.");
    }
    const saved = await ctx.db
      .query("eventScores")
      .withIndex("byEvent", (q) => q.eq("event", args.eventId))
      .collect();
    for (const row of saved) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.patch(resultsRow._id, { status: "draft", final: undefined });
    return null;
  },
});

/** Saves all TBA awards at an event. Calculating winners calls this. */
export const saveEventAwards = internalMutation({
  args: {
    eventId: v.id("events"),
    fetchedAt: v.number(),
    rows: v.array(v.object({ team: v.number(), awardType: v.number() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const awards = { fetchedAt: args.fetchedAt, rows: args.rows };
    const resultsRow = await getEventResultsRow(ctx, args.eventId);
    if (resultsRow === null) {
      await ctx.db.insert("eventResults", { event: args.eventId, status: "draft", awards });
    } else if (resultsRow.status === "draft") {
      await ctx.db.patch(resultsRow._id, { awards });
    }
    return null;
  },
});
