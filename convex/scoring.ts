import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { getDataEventCode } from "./lib/events/data";
import { categoryValidator, eventStatusValidator } from "./lib/events/validators";
import { getCategoryValues } from "./lib/scoring/category_values";
import { getGlobalValueInputs } from "./lib/scoring/global_value";
import {
  checkManualWinners,
  findEventCategoryWinners,
  getApiSourcesForConfigs,
  getSourcesForConfigs,
  loadApiSourceRows,
  loadEventSourceRows,
} from "./lib/scoring/event_winners";
import {
  generateWinnerConfig,
  type GenerationResult,
} from "./lib/scoring/generate/generate";
import { runConfigOnEvent } from "./lib/scoring/run_config";
import { getScriptSets } from "./lib/scoring/script/contract";
import { findLeastUnique, getUniqueness } from "./lib/scoring/event_scores";
import {
  winnerConfigSchema,
} from "./lib/scoring/winner_config";
import {
  apiCheckValidator,
  categoryPointsResultValidator,
  teamPointsValidator,
  categoryWinnerResultValidator,
  resultsStatusValidator,
  teamWinnerResultValidator,
} from "./lib/scoring/validators";
import {
  getCategoryWinnersRow,
  getEventCategories,
  getEventTeams,
  assertResultsNotFinal,
  getResultsStatus,
  resultMatchesSource,
  upsertCategoryWinners,
  getGlobalCategoryValues,
  getCategoryPointsRows,
  getScriptPoints,
} from "./lib/scoring/event_db";
import { getCurrentUser } from "./users";

export const currentUserIsAdmin = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    return currentUser?.isAdmin ?? false;
  },
});

/**
 * Runs a winner config against any event on TBA and Statbotics. Saves
 * nothing. Use it to check a config against past data.
 */
export const previewWinners = action({
  args: {
    year: v.number(),
    eventCode: v.string(),
    config: v.any(),
  },
  returns: v.object({
    winners: v.array(v.number()),
    teams: v.array(teamWinnerResultValidator),
    unknownFields: v.array(
      v.object({ measure: v.string(), source: v.string(), field: v.string() }),
    ),
    matchRowCount: v.number(),
    apiChecks: v.array(apiCheckValidator),
  }),
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(internal.scoring.currentUserIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Only admins can preview category winners.");
    }

    const parsed = winnerConfigSchema.safeParse(args.config);
    if (!parsed.success) {
      throw new Error(
        `The scoring config is not valid: ${parsed.error.issues
          .map((issue) => issue.message)
          .join(" ")}`,
      );
    }

    const eventCode = args.eventCode.trim();
    if (!/^[A-Za-z0-9]+$/.test(eventCode)) {
      throw new Error("Enter a valid event code.");
    }

    return await runConfigOnEvent(parsed.data, { year: args.year, eventCode });
  },
});

const eventScoringCategoryValidator = v.object({
  ...categoryValidator.fields,
  /** Number of submissions that picked the category. */
  picks: v.number(),
  baseValue: v.number(),
  /** Points for each winning picked team, with the current picks. */
  value: v.number(),
  isTop: v.boolean(),
  /** Global categories only: false when the value formula is missing or gives no value. */
  hasValue: v.boolean(),
  /** The current winners. Null when there are none yet. */
  result: v.union(categoryWinnerResultValidator, v.null()),
  /** Global categories with script points only: the last script points. */
  pointsResult: v.union(categoryPointsResultValidator, v.null()),
  /** Least unique categories only: the submissions that win it now. */
  leastUnique: v.union(
    v.array(v.object({ name: v.string(), uniqueness: v.number() })),
    v.null(),
  ),
});

/** The least unique submissions at an event, with their names. */
async function getLeastUniqueSubmissions(ctx: QueryCtx, picks: readonly Doc<"picks">[]) {
  const submissions = await Promise.all(
    picks.map(async (pick) => {
      const [user, pickTeams] = await Promise.all([
        ctx.db.get(pick.user),
        ctx.db.query("pickTeams").withIndex("byPick", (q) => q.eq("pick", pick._id)).collect(),
      ]);
      const teams = await Promise.all(pickTeams.map((row) => ctx.db.get(row.team)));
      return {
        id: pick._id,
        name:
          pick.displayName?.trim() ||
          (user === null ? "Unknown player" : `${user.firstName} ${user.lastName}`.trim()),
        teams: teams.filter((team) => team !== null).map((team) => Number(team.number)),
      };
    }),
  );
  const uniqueness = getUniqueness(submissions);
  const byId = new Map(uniqueness.map((row) => [row.submission, row.uniqueness]));
  const winners = new Set(findLeastUnique(uniqueness));
  return submissions
    .filter((submission) => winners.has(submission.id))
    .map((submission) => ({ name: submission.name, uniqueness: byId.get(submission.id) ?? 0 }));
}

/**
 * The categories at an event with their current value and winners, for the
 * admin scoring page.
 */
export const getEventScoring = query({
  args: { eventId: v.string() },
  returns: v.union(
    v.object({
      event: v.object({
        _id: v.id("events"),
        name: v.string(),
        displayName: v.string(),
        eventCode: v.string(),
        status: eventStatusValidator,
        year: v.number(),
        resultsStatus: resultsStatusValidator,
      }),
      submissionCount: v.number(),
      teams: v.array(v.object({ number: v.number(), name: v.string() })),
      categories: v.array(eventScoringCategoryValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can view event scoring.");
    }

    const eventId = ctx.db.normalizeId("events", args.eventId);
    const event = eventId === null ? null : await ctx.db.get(eventId);
    if (event === null) {
      return null;
    }

    const season = await ctx.db.get(event.season);
    if (season === null) {
      throw new Error("The event's season was not found.");
    }

    const [categories, picks, winnerRows, teams, resultsStatus, pointsRows] = await Promise.all([
      getEventCategories(ctx, event),
      ctx.db
        .query("picks")
        .withIndex("byEvent", (q) => q.eq("event", event._id))
        .collect(),
      ctx.db
        .query("categoryWinners")
        .withIndex("byEvent", (q) => q.eq("event", event._id))
        .collect(),
      getEventTeams(ctx, event._id),
      getResultsStatus(ctx, event._id),
      getCategoryPointsRows(ctx, event._id),
    ]);

    const categoryIds = new Set(categories.map((category) => category._id));
    // A pick can hold a category the event no longer offers.
    const submissions = await Promise.all(
      picks.map(async (pick) => ({
        categoryIds: pick.categories.filter((id) => categoryIds.has(id)),
        teams: (
          await ctx.db
            .query("pickTeams")
            .withIndex("byPick", (q) => q.eq("pick", pick._id))
            .collect()
        ).map((row) => row.team),
      })),
    );
    const leastUnique = categories.some(
      (category) => category.winnerSource?.type === "leastUnique",
    )
      ? await getLeastUniqueSubmissions(ctx, picks)
      : [];
    const globalValues = getGlobalCategoryValues(
      categories,
      getGlobalValueInputs({
        chosenCategoryIds: categories
          .filter((category) => !category.isGlobal)
          .map((category) => category._id),
        submissions,
      }),
      getScriptPoints(pointsRows),
    );
    const { values } = getCategoryValues({
      categoryIds: [...categoryIds],
      submissions,
      globalPoints: globalValues,
    });
    const resultsByCategory = new Map(
      winnerRows.map((row) => [row.category, row.result]),
    );

    return {
      event: {
        _id: event._id,
        name: event.name,
        displayName: event.displayName,
        eventCode: event.eventCode,
        status: event.status,
        year: season.year,
        resultsStatus,
      },
      submissionCount: picks.length,
      teams: teams.toSorted((a, b) => a.number - b.number),
      categories: categories.map((category) => {
        const value = values.get(category._id);
        if (value === undefined) {
          throw new Error(`No value for category ${category._id}.`);
        }
        const result = resultsByCategory.get(category._id) ?? null;
        return {
          ...category,
          ...value,
          hasValue: !category.isGlobal || globalValues.get(category._id) !== null,
          result: resultMatchesSource(result, category.winnerSource)
            ? result
            : null,
          pointsResult:
            category.isGlobal && category.pointsSource === "script"
              ? (pointsRows.get(category._id) ?? null)
              : null,
          leastUnique: category.winnerSource?.type === "leastUnique" ? leastUnique : null,
        };
      }),
    };
  },
});

export const getCalculationInput = internalQuery({
  args: { eventId: v.id("events") },
  returns: v.object({
    isAdmin: v.boolean(),
    isFinal: v.boolean(),
    year: v.number(),
    eventCode: v.string(),
    teams: v.array(v.number()),
    categories: v.array(
      v.object({ categoryId: v.id("categories"), config: v.any() }),
    ),
    /** The number of categories whose winners or points come from a script. */
    scriptCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (event === null) {
      throw new Error("Event not found.");
    }
    const season = await ctx.db.get(event.season);
    if (season === null) {
      throw new Error("The event's season was not found.");
    }

    const [categories, teams, resultsStatus] = await Promise.all([
      getEventCategories(ctx, event),
      getEventTeams(ctx, event._id),
      getResultsStatus(ctx, event._id),
    ]);

    return {
      isAdmin: currentUser?.isAdmin ?? false,
      isFinal: resultsStatus === "final",
      year: season.year,
      eventCode: getDataEventCode(event),
      teams: teams.map((team) => team.number),
      categories: categories.flatMap((category) =>
        category.winnerSource?.type === "config"
          ? [{ categoryId: category._id, config: category.winnerSource.config }]
          : [],
      ),
      scriptCount: categories.filter((category) => getScriptSets(category) !== null).length,
    };
  },
});

export const saveCalculatedWinners = internalMutation({
  args: {
    eventId: v.id("events"),
    calculatedAt: v.number(),
    outcomes: v.array(
      v.union(
        v.object({
          categoryId: v.id("categories"),
          type: v.literal("config"),
          winners: v.array(v.number()),
          teams: v.array(teamWinnerResultValidator),
        }),
        v.object({
          categoryId: v.id("categories"),
          type: v.literal("error"),
          message: v.string(),
        }),
      ),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // The results can become final while the action runs.
    if ((await getResultsStatus(ctx, args.eventId)) === "final") {
      return null;
    }
    for (const { categoryId, ...outcome } of args.outcomes) {
      // The category can change to manual while the action runs.
      const category = await ctx.db.get(categoryId);
      if (category?.winnerSource?.type !== "config") {
        continue;
      }

      await upsertCategoryWinners(ctx, args.eventId, categoryId, {
        ...outcome,
        calculatedAt: args.calculatedAt,
      });
    }
    return null;
  },
});

/**
 * Gets the latest TBA and Statbotics data for an event and saves the winners
 * of each automatic category. Manual categories do not change. Also saves the
 * event's TBA awards, for the award deduction.
 */
export const calculateEventWinners = action({
  args: { eventId: v.id("events") },
  returns: v.object({
    calculated: v.number(),
    errors: v.number(),
    /** The awards error, or null when the awards were saved. */
    awardsError: v.union(v.string(), v.null()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ calculated: number; errors: number; awardsError: string | null }> => {
    const input = await ctx.runQuery(internal.scoring.getCalculationInput, {
      eventId: args.eventId,
    });
    if (!input.isAdmin) {
      throw new Error("Only admins can calculate category winners.");
    }
    if (input.isFinal) {
      throw new Error("The results are final. Reopen them to calculate winners again.");
    }
    if (input.teams.length === 0) {
      throw new Error("Load the event's teams first.");
    }

    const configs = input.categories.map((category) => category.config);
    const [sourceRows, apiRows] = await Promise.all([
      loadEventSourceRows({
        year: input.year,
        eventCode: input.eventCode,
        teams: input.teams,
        sources: [...new Set([...getSourcesForConfigs(configs), "tba.awards" as const])],
      }),
      loadApiSourceRows({
        year: input.year,
        eventCode: input.eventCode,
        specs: getApiSourcesForConfigs(configs),
      }),
    ]);

    const awards = sourceRows.rows["tba.awards"];
    if (awards !== undefined) {
      await ctx.runMutation(internal.results.saveEventAwards, {
        eventId: args.eventId,
        fetchedAt: Date.now(),
        rows: awards.flatMap((row) =>
          typeof row.team === "number" && typeof row.awardType === "number"
            ? [{ team: row.team, awardType: row.awardType }]
            : [],
        ),
      });
    }
    const awardsError =
      awards === undefined
        ? (sourceRows.failures.get("tba.awards") ?? "The awards could not be loaded.")
        : null;

    const outcomes = findEventCategoryWinners({
      categories: input.categories,
      teams: input.teams,
      sourceRows: { ...sourceRows, api: apiRows.rows, apiFailures: apiRows.failures },
    });
    if (outcomes.length > 0) {
      await ctx.runMutation(internal.scoring.saveCalculatedWinners, {
        eventId: args.eventId,
        calculatedAt: Date.now(),
        outcomes,
      });
    }
    const configErrors = outcomes.filter((outcome) => outcome.type === "error").length;

    // Scripts run after the configs and awards are saved, so they can read them.
    const scripts =
      input.scriptCount === 0
        ? { calculated: 0, errors: 0 }
        : await ctx.runAction(internal.scoringScripts.runEventScripts, { eventId: args.eventId });

    return {
      calculated: outcomes.length - configErrors + scripts.calculated,
      errors: configErrors + scripts.errors,
      awardsError,
    };
  },
});

/**
 * Sets the winners of a manual category at an event. An empty list removes
 * the winners. A category whose points source is "manual" also needs each
 * winner's points.
 */
export const setManualWinners = mutation({
  args: {
    eventId: v.id("events"),
    categoryId: v.id("categories"),
    winners: v.array(v.number()),
    teamPoints: v.optional(teamPointsValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can set category winners.");
    }

    const [event, category] = await Promise.all([
      ctx.db.get(args.eventId),
      ctx.db.get(args.categoryId),
    ]);
    if (event === null) {
      throw new Error("Event not found.");
    }
    if (category === null || !event.categories.includes(category._id)) {
      throw new Error("The category is not offered at this event.");
    }
    if (category.winnerSource?.type !== "manual") {
      throw new Error("Only manual categories take winners from an admin.");
    }
    await assertResultsNotFinal(ctx, event._id);

    const eventTeams = await getEventTeams(ctx, event._id);
    const winners = checkManualWinners(
      args.winners,
      new Set(eventTeams.map((team) => team.number)),
    );

    if (winners.length === 0) {
      const existing = await getCategoryWinnersRow(ctx, event._id, category._id);
      if (existing !== null) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    const usesTeamPoints = category.isGlobal && category.pointsSource === "manual";
    const teamPoints = usesTeamPoints ? checkTeamPoints(winners, args.teamPoints ?? []) : undefined;

    await upsertCategoryWinners(ctx, event._id, category._id, {
      type: "manual",
      winners,
      ...(teamPoints === undefined ? {} : { teamPoints }),
      updatedBy: currentUser._id,
      updatedAt: Date.now(),
    });
    return null;
  },
});

const MAX_TEAM_POINTS = 1000;

/** Each winner needs whole-number points. Points for a team that did not win are dropped. */
function checkTeamPoints(
  winners: readonly number[],
  teamPoints: readonly { team: number; points: number }[],
) {
  const byTeam = new Map(teamPoints.map((row) => [row.team, row.points]));
  return winners.map((team) => {
    const points = byTeam.get(team);
    if (points === undefined) {
      throw new Error(`Set the points of team ${team}.`);
    }
    if (!Number.isInteger(points) || Math.abs(points) > MAX_TEAM_POINTS) {
      throw new Error(`Team ${team}'s points must be a whole number from -${MAX_TEAM_POINTS} to ${MAX_TEAM_POINTS}.`);
    }
    return { team, points };
  });
}

export const getGenerationInput = internalQuery({
  args: { categoryId: v.id("categories") },
  returns: v.object({
    isAdmin: v.boolean(),
    categoryText: v.string(),
    year: v.number(),
    gameName: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      throw new Error("Category not found.");
    }
    const season = await ctx.db.get(category.season);
    if (season === null) {
      throw new Error("The category's season was not found.");
    }
    return {
      isAdmin: currentUser?.isAdmin ?? false,
      categoryText: category.text,
      year: season.year,
      gameName: season.gameName,
    };
  },
});

/**
 * Asks an LLM to write a winner config from a plain-language rule. The model
 * can read the typed sources and event-scoped TBA, Statbotics and FRC Events
 * endpoints, and tests its config on the example event. Saves nothing.
 */
export const generateConfig = action({
  args: {
    categoryId: v.id("categories"),
    description: v.string(),
    eventCode: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.literal("ok"),
      config: v.any(),
      notes: v.array(v.string()),
    }),
    v.object({
      status: v.literal("unsupported"),
      reason: v.string(),
      notes: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args): Promise<GenerationResult> => {
    const input = await ctx.runQuery(internal.scoring.getGenerationInput, {
      categoryId: args.categoryId,
    });
    if (!input.isAdmin) {
      throw new Error("Only admins can generate scoring configs.");
    }

    const description = args.description.trim();
    if (description.length === 0 || description.length > 1000) {
      throw new Error("Describe the rule in 1 to 1000 characters.");
    }
    const eventCode = args.eventCode.trim();
    if (!/^[A-Za-z0-9]+$/.test(eventCode)) {
      throw new Error("Enter a valid example event code.");
    }

    return await generateWinnerConfig({
      categoryText: input.categoryText,
      description,
      year: input.year,
      gameName: input.gameName,
      eventCode,
    });
  },
});
