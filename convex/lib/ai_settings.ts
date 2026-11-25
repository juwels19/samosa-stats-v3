import type { QueryCtx } from "../_generated/server";

export type DisplayNameSuggestionSettings = { enabled: boolean };

/** The saved display name settings, or the defaults when none are saved. */
export async function getDisplayNameSuggestionSettings(
  ctx: QueryCtx,
): Promise<DisplayNameSuggestionSettings> {
  const settings = await ctx.db.query("aiSettings").first();
  return settings?.displayNameSuggestions ?? { enabled: true };
}
