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
