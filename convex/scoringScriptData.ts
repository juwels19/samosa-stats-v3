import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { getEventCategories, getEventTeams, getResultsStatus, upsertCategoryPoints, upsertCategoryWinners } from "./lib/scoring/event_db";
import { getScriptSets } from "./lib/scoring/script/contract";
import { loadScriptContext } from "./lib/scoring/script/context";
import { scriptApiCallValidator, scriptTeamResultValidator } from "./lib/scoring/validators";
import { getCurrentUser } from "./users";

/** Database reads and writes for the scoring script actions in `scoringScripts.ts`. */

const setsValidator = v.object({ winners: v.boolean(), points: v.boolean() });

/** The example event for a category's script: the event in its season with this code. */
export const getExampleInput = internalQuery({
  args: { categoryId: v.id("categories"), eventCode: v.string() },
  returns: v.object({
    isAdmin: v.boolean(),
    categoryText: v.string(),
    isGlobal: v.boolean(),
    year: v.number(),
    gameName: v.string(),
    context: v.any(),
    teamNumbers: v.array(v.number()),
  }),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (category === null) throw new Error("Category not found.");
    const season = await ctx.db.get(category.season);
    if (season === null) throw new Error("The category's season was not found.");

    const code = args.eventCode.trim().toUpperCase();
    const event = await ctx.db
      .query("events")
      .withIndex("bySeasonAndEventCode", (q) => q.eq("season", season._id).eq("eventCode", code))
      .first();
    if (event === null) {
      throw new Error(`No ${season.year} event has the code ${code.toLowerCase()}. Scripts test on an event in the app, with its picks.`);
    }
    if (!event.categories.includes(category._id)) {
      throw new Error(`${event.displayName} does not offer this category.`);
    }

    const [context, teams] = await Promise.all([
      loadScriptContext(ctx, event, category),
      getEventTeams(ctx, event._id),
    ]);
    return {
      isAdmin: currentUser?.isAdmin ?? false,
      categoryText: category.text,
      isGlobal: category.isGlobal,
      year: season.year,
      gameName: season.gameName,
      context,
      teamNumbers: teams.map((team) => team.number),
    };
  },
});

/** Each category at the event whose winners or points come from a script, with its data. */
export const getEventScriptInputs = internalQuery({
  args: { eventId: v.id("events") },
  returns: v.object({
    isFinal: v.boolean(),
    teamNumbers: v.array(v.number()),
    scripts: v.array(
      v.object({
        categoryId: v.id("categories"),
        code: v.string(),
        sets: setsValidator,
        context: v.any(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (event === null) throw new Error("Event not found.");
    const [categories, teams, status] = await Promise.all([
      getEventCategories(ctx, event),
      getEventTeams(ctx, event._id),
      getResultsStatus(ctx, event._id),
    ]);

    const scripts = await Promise.all(
      categories.flatMap((category) => {
        const sets = getScriptSets(category);
        if (sets === null || category.script === undefined) return [];
        const code = category.script.code;
        return [
          loadScriptContext(ctx, event, category).then((context) => ({
            categoryId: category._id,
            code,
            sets,
            context,
          })),
        ];
      }),
    );
    return {
      isFinal: status === "final",
      teamNumbers: teams.map((team) => team.number),
      scripts,
    };
  },
});

export const saveScriptResults = internalMutation({
  args: {
    eventId: v.id("events"),
    calculatedAt: v.number(),
    outcomes: v.array(
      v.union(
        v.object({
          categoryId: v.id("categories"),
          type: v.literal("ok"),
          winners: v.union(v.array(v.number()), v.null()),
          points: v.union(v.number(), v.null()),
          explanation: v.string(),
          teams: v.array(scriptTeamResultValidator),
          apiCalls: v.array(scriptApiCallValidator),
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
    // The results can become final while the scripts run.
    if ((await getResultsStatus(ctx, args.eventId)) === "final") return null;

    for (const outcome of args.outcomes) {
      // The category's scoring can change while the scripts run.
      const category = await ctx.db.get(outcome.categoryId);
      const sets = category === null ? null : getScriptSets(category);
      if (sets === null) continue;

      if (outcome.type === "error") {
        const error = { type: "error" as const, message: outcome.message, calculatedAt: args.calculatedAt };
        if (sets.winners) await upsertCategoryWinners(ctx, args.eventId, outcome.categoryId, error);
        if (sets.points) await upsertCategoryPoints(ctx, args.eventId, outcome.categoryId, error);
        continue;
      }

      if (sets.winners) {
        await upsertCategoryWinners(ctx, args.eventId, outcome.categoryId, {
          type: "script",
          winners: outcome.winners ?? [],
          explanation: outcome.explanation,
          teams: outcome.teams,
          apiCalls: outcome.apiCalls,
          calculatedAt: args.calculatedAt,
        });
      }
      if (sets.points) {
        await upsertCategoryPoints(ctx, args.eventId, outcome.categoryId, {
          type: "script",
          points: outcome.points,
          explanation: outcome.explanation,
          apiCalls: outcome.apiCalls,
          calculatedAt: args.calculatedAt,
        });
      }
    }
    return null;
  },
});
