import { v } from "convex/values";

/**
 * How a category finds its winners. A config is stored as `v.any()` because
 * Convex validators can't express it. Every write checks it with
 * `winnerConfigSchema` first.
 */
export const winnerSourceValidator = v.union(
  v.object({ type: v.literal("manual") }),
  v.object({ type: v.literal("config"), config: v.any() }),
);

/** One team's result from a winner config. */
export const teamWinnerResultValidator = v.object({
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
 * The winners of one category at one event. `config` and `error` come from
 * the last calculation. `manual` comes from an admin.
 */
export const categoryWinnerResultValidator = v.union(
  v.object({
    type: v.literal("config"),
    winners: v.array(v.number()),
    teams: v.array(teamWinnerResultValidator),
    calculatedAt: v.number(),
  }),
  v.object({
    type: v.literal("error"),
    message: v.string(),
    calculatedAt: v.number(),
  }),
  v.object({
    type: v.literal("manual"),
    winners: v.array(v.number()),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }),
);

/** How a custom source measure read an event's data. See `run_config.ts`. */
export const apiCheckValidator = v.object({
  measure: v.string(),
  service: v.string(),
  path: v.string(),
  rowCount: v.number(),
  teamCount: v.number(),
  valueCount: v.number(),
  error: v.optional(v.string()),
  ok: v.boolean(),
});
