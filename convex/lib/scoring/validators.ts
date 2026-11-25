import { v } from "convex/values";

/**
 * How a category finds its winners. A config is stored as `v.any()` because
 * Convex validators can't express it. Every write checks it with
 * `winnerConfigSchema` first.
 */
export const winnerSourceValidator = v.union(
  v.object({ type: v.literal("manual") }),
  v.object({ type: v.literal("config"), config: v.any() }),
  /** The category's script finds the winners. See `categories.script`. */
  v.object({ type: v.literal("script") }),
  /** Global categories only: the least unique submissions win, not teams. */
  v.object({ type: v.literal("leastUnique") }),
);

/**
 * Where a global category's points come from. Not set means its formula.
 * "manual" means an admin sets each winning team's points, with manual winners.
 */
export const pointsSourceValidator = v.union(
  v.literal("formula"),
  v.literal("script"),
  v.literal("manual"),
);

/** The points an admin set for each winning team. */
export const teamPointsValidator = v.array(v.object({ team: v.number(), points: v.number() }));

/**
 * A script that AI writes from a plain-language rule. It runs in a Vercel
 * Sandbox at each event. See "Scoring scripts" in docs/scoring.md.
 */
export const scoringScriptValidator = v.object({
  code: v.string(),
  /** The rule the script was written from. */
  description: v.string(),
  updatedAt: v.number(),
});

/** One API request a script made. */
export const scriptApiCallValidator = v.object({
  service: v.string(),
  path: v.string(),
  status: v.union(v.number(), v.null()),
  bytes: v.number(),
  ms: v.number(),
});

/** One team's value and note from a script. */
export const scriptTeamResultValidator = v.object({
  team: v.number(),
  value: v.union(v.number(), v.null()),
  note: v.union(v.string(), v.null()),
});

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
    /** Set when the category's points source is "manual": each winner's points. */
    teamPoints: v.optional(teamPointsValidator),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }),
  v.object({
    type: v.literal("script"),
    winners: v.array(v.number()),
    explanation: v.string(),
    teams: v.array(scriptTeamResultValidator),
    apiCalls: v.array(scriptApiCallValidator),
    calculatedAt: v.number(),
  }),
);

/** A global category's points at one event, from its script. */
export const categoryPointsResultValidator = v.union(
  v.object({
    type: v.literal("script"),
    /** Null when the script gives no points at this event. */
    points: v.union(v.number(), v.null()),
    explanation: v.string(),
    apiCalls: v.array(scriptApiCallValidator),
    calculatedAt: v.number(),
  }),
  v.object({
    type: v.literal("error"),
    message: v.string(),
    calculatedAt: v.number(),
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

/** One line of a submission's event score. See "Event score" in docs/scoring.md. */
export const scoreLineItemValidator = v.union(
  v.object({
    type: v.literal("category"),
    category: v.id("categories"),
    team: v.number(),
    amount: v.number(),
  }),
  v.object({ type: v.literal("award"), team: v.number(), amount: v.number() }),
  v.object({
    type: v.literal("leastUnique"),
    /** The least unique category. Not set on scores saved before it was a category. */
    category: v.optional(v.id("categories")),
    amount: v.number(),
  }),
);

export const resultsStatusValidator = v.union(v.literal("draft"), v.literal("final"));

export const eventResultsFields = {
  event: v.id("events"),
  status: resultsStatusValidator,
  /** All TBA awards at the event, saved when winners are calculated. */
  awards: v.optional(
    v.object({
      fetchedAt: v.number(),
      rows: v.array(v.object({ team: v.number(), awardType: v.number() })),
    }),
  ),
  /** The values used for the saved scores. Set while the results are final. */
  final: v.optional(
    v.object({
      finalizedAt: v.number(),
      finalizedBy: v.id("users"),
      topCatValue: v.number(),
      topTeamValue: v.number(),
      deductionAwardType: v.number(),
      awardWinners: v.array(v.number()),
    }),
  ),
};

export const eventScoreFields = {
  event: v.id("events"),
  pick: v.id("picks"),
  user: v.id("users"),
  /** The name shown for the submission when the results were finalized. */
  name: v.string(),
  teams: v.array(v.number()),
  /** The categories the player chose. Not set on scores saved before this field existed. */
  categories: v.optional(v.array(v.id("categories"))),
  total: v.number(),
  uniqueness: v.number(),
  lineItems: v.array(scoreLineItemValidator),
};
