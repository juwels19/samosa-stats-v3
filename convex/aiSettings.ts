import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getDisplayNameSuggestionSettings } from "./lib/ai_settings";
import { getCurrentUser } from "./users";

/** The model is chosen in the AI Gateway router, not here. */
const displayNameSettingsValidator = v.object({ enabled: v.boolean() });

export const get = query({
  args: {},
  returns: v.object({ displayNameSuggestions: displayNameSettingsValidator }),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can view AI settings.");
    }
    return { displayNameSuggestions: await getDisplayNameSuggestionSettings(ctx) };
  },
});

/** For the picks form, which hides Suggest when suggestions are off. */
export const areDisplayNameSuggestionsEnabled = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => (await getDisplayNameSuggestionSettings(ctx)).enabled,
});

export const setDisplayNameSuggestions = mutation({
  args: displayNameSettingsValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can change AI settings.");
    }
    const settings = await ctx.db.query("aiSettings").first();
    const displayNameSuggestions = { enabled: args.enabled };
    if (settings === null) {
      await ctx.db.insert("aiSettings", { displayNameSuggestions });
    } else {
      await ctx.db.patch(settings._id, { displayNameSuggestions });
    }
    return null;
  },
});
