import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { findUnknownFields } from "./lib/scoring/field_paths";
import { findCategoryWinners } from "./lib/scoring/find_category_winners";
import { loadScoringEventData } from "./lib/scoring/sources/event_data";
import {
  getRequiredSources,
  winnerConfigSchema,
} from "./lib/scoring/winner_config";
import { getCurrentUser } from "./users";

export const currentUserIsAdmin = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    return currentUser?.isAdmin ?? false;
  },
});

const teamPreviewValidator = v.object({
  team: v.number(),
  measures: v.record(v.string(), v.union(v.number(), v.null())),
  value: v.union(v.number(), v.null()),
  excludedReason: v.optional(
    v.union(
      v.literal("notInScope"),
      v.literal("missingData"),
      v.literal("divideByZero"),
    ),
  ),
  isWinner: v.boolean(),
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
    teams: v.array(teamPreviewValidator),
    unknownFields: v.array(
      v.object({ measure: v.string(), source: v.string(), field: v.string() }),
    ),
    matchRowCount: v.number(),
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

    const data = await loadScoringEventData({
      year: args.year,
      eventCode,
      sources: getRequiredSources(parsed.data),
    });
    const result = findCategoryWinners(parsed.data, data);

    return {
      ...result,
      unknownFields: findUnknownFields(parsed.data, args.year),
      matchRowCount: data.sources["tba.matches"].length,
    };
  },
});
