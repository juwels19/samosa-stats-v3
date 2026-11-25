import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import {
  SUGGESTIONS_PER_SUBMISSION,
  generateDisplayName,
  type DisplayNameContext,
} from "./lib/picks/display_name";
import {
  getEventSubmissionData,
  getGlobalCategoryIdsForEvent,
} from "./lib/picks/get_event_submission_data";
import {
  randomizeIsRandom,
  randomizePickSelections,
} from "./lib/picks/randomize_pick_selections";
import { replacePickSelections } from "./lib/picks/replace_pick_selections";
import { validatePickSubmission } from "./lib/picks/validate_pick_submission";
import { normalizeEventCode } from "./lib/events/normalize_event_code";
import { sortCategoriesByText } from "./lib/events/sort";
import {
  eventPickValidator,
  pickSubmissionDataValidator,
} from "./lib/picks/validators";
import { getDisplayNameSuggestionSettings } from "./lib/ai_settings";
import { getCurrentUser } from "./users";


export const listPicksForEvent = query({
  args: {
    eventCode: v.string(),
    year: v.number(),
  },
  returns: v.array(eventPickValidator),
  handler: async (ctx, args) => {
    const season = await ctx.db
      .query("seasons")
      .withIndex("byYear", (q) => q.eq("year", args.year))
      .unique();

    if (season === null) {
      return [];
    }

    const event = await ctx.db
      .query("events")
      .withIndex("bySeasonAndEventCode", (q) =>
        q
          .eq("season", season._id)
          .eq("eventCode", normalizeEventCode(args.eventCode)),
      )
      .unique();

    if (event === null) {
      return [];
    }

    const picks = await ctx.db
      .query("picks")
      .withIndex("byEvent", (q) => q.eq("event", event._id))
      .collect();

    return await Promise.all(
      picks.map(async (pick) => {
        const [pickTeams, pickCategories] = await Promise.all([
          ctx.db
            .query("pickTeams")
            .withIndex("byPick", (q) => q.eq("pick", pick._id))
            .collect(),
          ctx.db
            .query("pickCategories")
            .withIndex("byPick", (q) => q.eq("pick", pick._id))
            .collect(),
        ]);

        const teamIds = pickTeams.map((pickTeam) => pickTeam.team);
        const categoryIds =
          pickCategories.length > 0
            ? pickCategories.map((pickCategory) => pickCategory.category)
            : pick.categories;

        const [teams, categories] = await Promise.all([
          Promise.all(teamIds.map(async (teamId) => await ctx.db.get(teamId))),
          Promise.all(
            categoryIds.map(async (categoryId) => await ctx.db.get(categoryId)),
          ),
        ]);

        return {
          _id: pick._id,
          _creationTime: pick._creationTime,
          displayName: pick.displayName,
          isRandom: pick.isRandom,
          user: pick.user,
          teams: teams
            .filter((team) => team !== null)
            .toSorted((a, b) => {
              if (a.number === b.number) {
                return a.name.localeCompare(b.name);
              }

              return a.number < b.number ? -1 : 1;
            }),
          categories: sortCategoriesByText(
            categories.filter((category) => category !== null),
          ),
        };
      }),
    );
  },
});

export const getForEventSubmission = query({
  args: {
    eventCode: v.string(),
  },
  returns: pickSubmissionDataValidator,
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Sign in to submit picks.");
    }

    if (!currentUser.isApproved && !currentUser.isAdmin) {
      throw new Error("Approved access is required to submit picks.");
    }

    return await getEventSubmissionData(ctx, {
      eventCode: args.eventCode,
      userId: currentUser._id,
    });
  },
});

export const submit = mutation({
  args: {
    eventCode: v.string(),
    teamIds: v.array(v.id("teams")),
    categoryIds: v.array(v.id("categories")),
    displayName: v.optional(v.string()),
    isRandom: v.boolean(),
  },
  returns: v.id("picks"),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Sign in to submit picks.");
    }

    if (!currentUser.isApproved && !currentUser.isAdmin) {
      throw new Error("Approved access is required to submit picks.");
    }

    const submissionData = await getEventSubmissionData(ctx, {
      eventCode: args.eventCode,
      userId: currentUser._id,
    });

    if (submissionData === null) {
      throw new Error("Event not found.");
    }

    const displayName = normalizeDisplayName(args.displayName);

    const event = await ctx.db.get(submissionData.event._id);

    if (event === null) {
      throw new Error("Event not found.");
    }

    const globalCategoryIds = await getGlobalCategoryIdsForEvent(
      ctx,
      event.categories,
    );
    const selectableCategoryIds = submissionData.categories.map(
      (category) => category._id,
    );

    validatePickSubmission({
      event: submissionData.event,
      eventTeamIds: submissionData.teams.map((team) => team._id),
      selectableCategoryIds,
      globalCategoryIds,
      teamIds: args.teamIds,
      categoryIds: args.categoryIds,
      displayName,
      isRandom: args.isRandom,
    });

    // Globals are always applied; only season picks count toward numberOfCategoryPicks.
    const storedCategoryIds = [...globalCategoryIds, ...args.categoryIds];
    const existingPick = submissionData.existingPick;
    const pickId =
      existingPick === null
        ? await ctx.db.insert("picks", {
          event: submissionData.event._id,
          user: currentUser._id,
          ...(displayName === undefined ? {} : { displayName }),
          isRandom: args.isRandom,
          categories: storedCategoryIds,
        })
        : existingPick._id;

    if (existingPick !== null) {
      await ctx.db.patch(pickId, {
        displayName,
        isRandom: args.isRandom,
        categories: storedCategoryIds,
      });
    }

    await replacePickSelections(ctx, {
      pickId,
      teamIds: args.teamIds,
      categoryIds: storedCategoryIds,
    });

    return pickId;
  },
});

export const generateRandom = mutation({
  args: {
    eventCode: v.string(),
  },
  returns: v.object({
    pickId: v.id("picks"),
    isRandom: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Sign in to submit picks.");
    }

    if (!currentUser.isApproved && !currentUser.isAdmin) {
      throw new Error("Approved access is required to submit picks.");
    }

    const submissionData = await getEventSubmissionData(ctx, {
      eventCode: args.eventCode,
      userId: currentUser._id,
    });

    if (submissionData === null) {
      throw new Error("Event not found.");
    }

    const numberOfTeamPicks = Number(submissionData.event.numberOfTeamPicks);
    const numberOfCategoryPicks = Number(
      submissionData.event.numberOfCategoryPicks,
    );

    if (
      submissionData.teams.length < numberOfTeamPicks ||
      submissionData.categories.length < numberOfCategoryPicks
    ) {
      throw new Error(
        "This event does not have enough teams or categories yet.",
      );
    }

    const teamIds = randomizePickSelections({
      ids: submissionData.teams.map((team) => team._id),
      count: numberOfTeamPicks,
    });
    const categoryIds = randomizePickSelections({
      ids: submissionData.categories.map((category) => category._id),
      count: numberOfCategoryPicks,
    });
    const isRandom = randomizeIsRandom();

    const event = await ctx.db.get(submissionData.event._id);

    if (event === null) {
      throw new Error("Event not found.");
    }

    const globalCategoryIds = await getGlobalCategoryIdsForEvent(
      ctx,
      event.categories,
    );
    const selectableCategoryIds = submissionData.categories.map(
      (category) => category._id,
    );

    validatePickSubmission({
      event: submissionData.event,
      eventTeamIds: submissionData.teams.map((team) => team._id),
      selectableCategoryIds,
      globalCategoryIds,
      teamIds,
      categoryIds,
      isRandom,
    });

    const storedCategoryIds = [...globalCategoryIds, ...categoryIds];
    const pickId = await ctx.db.insert("picks", {
      event: submissionData.event._id,
      user: currentUser._id,
      isRandom,
      categories: storedCategoryIds,
      displayName: `Random pick for ${submissionData.event.eventCode}`,
    })

    await replacePickSelections(ctx, {
      pickId,
      teamIds,
      categoryIds: storedCategoryIds,
    });

    return { pickId, isRandom };
  },
});

function normalizeDisplayName(displayName: string | undefined) {
  const trimmedDisplayName = displayName?.trim();

  return trimmedDisplayName === "" ? undefined : trimmedDisplayName;
}

const displayNameContextValidator = v.object({
  eventName: v.string(),
  teams: v.array(v.object({ number: v.number(), name: v.string() })),
  categories: v.array(v.string()),
});

async function getDisplayNameContext(
  ctx: QueryCtx,
  {
    event,
    teamIds,
    categoryIds,
  }: {
    event: Doc<"events">;
    teamIds: Id<"teams">[];
    categoryIds: Id<"categories">[];
  },
): Promise<DisplayNameContext> {
  const [teams, categories] = await Promise.all([
    Promise.all(teamIds.map(async (id) => await ctx.db.get(id))),
    Promise.all(categoryIds.map(async (id) => await ctx.db.get(id))),
  ]);
  return {
    eventName: event.name,
    teams: teams
      .filter((team) => team !== null)
      .map((team) => ({ number: Number(team.number), name: team.name })),
    categories: categories
      .filter((category) => category !== null)
      .map((category) => category.text),
  };
}

/**
 * Counts one suggestion for the player's submission and gets what the model
 * needs. Throws when the player can't submit picks or used all suggestions
 * for this event.
 */
export const startDisplayNameSuggestion = internalMutation({
  args: {
    eventCode: v.string(),
    teamIds: v.array(v.id("teams")),
    categoryIds: v.array(v.id("categories")),
  },
  returns: displayNameContextValidator,
  handler: async (ctx, args) => {
    const settings = await getDisplayNameSuggestionSettings(ctx);
    if (!settings.enabled) {
      throw new Error("Name suggestions are turned off.");
    }
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Sign in to get a name suggestion.");
    }
    if (!currentUser.isApproved && !currentUser.isAdmin) {
      throw new Error("Approved access is required to get a name suggestion.");
    }

    const submissionData = await getEventSubmissionData(ctx, {
      eventCode: args.eventCode,
      userId: currentUser._id,
    });
    const event =
      submissionData === null ? null : await ctx.db.get(submissionData.event._id);
    if (event === null) {
      throw new Error("Event not found.");
    }

    const usage = await ctx.db
      .query("displayNameSuggestionCounts")
      .withIndex("byUserAndEvent", (q) => q.eq("user", currentUser._id).eq("event", event._id))
      .unique();
    if ((usage?.count ?? 0) >= SUGGESTIONS_PER_SUBMISSION) {
      throw new Error(
        `You used all ${SUGGESTIONS_PER_SUBMISSION} name suggestions for this event. Type a name instead.`,
      );
    }
    if (usage === null) {
      await ctx.db.insert("displayNameSuggestionCounts", {
        user: currentUser._id,
        event: event._id,
        count: 1,
      });
    } else {
      await ctx.db.patch(usage._id, { count: usage.count + 1 });
    }

    const context = await getDisplayNameContext(ctx, {
      event,
      teamIds: args.teamIds,
      categoryIds: args.categoryIds,
    });
    return context;
  },
});

/** An AI display name for the picks the player has selected so far. */
export const suggestDisplayName = action({
  args: {
    eventCode: v.string(),
    teamIds: v.array(v.id("teams")),
    categoryIds: v.array(v.id("categories")),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const context = await ctx.runMutation(internal.picks.startDisplayNameSuggestion, args);
    return await generateDisplayName(context);
  },
});

export const getDisplayNameSettings = internalQuery({
  args: {},
  returns: v.object({ enabled: v.boolean() }),
  handler: async (ctx) => await getDisplayNameSuggestionSettings(ctx),
});

export const getPickNameContext = internalQuery({
  args: { pickId: v.id("picks") },
  returns: v.union(displayNameContextValidator, v.null()),
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.pickId);
    const event = pick === null ? null : await ctx.db.get(pick.event);
    if (pick === null || event === null) return null;
    const pickTeams = await ctx.db
      .query("pickTeams")
      .withIndex("byPick", (q) => q.eq("pick", pick._id))
      .collect();
    return await getDisplayNameContext(ctx, {
      event,
      teamIds: pickTeams.map((row) => row.team),
      categoryIds: pick.categories,
    });
  },
});

export const setPickDisplayName = internalMutation({
  args: { pickId: v.id("picks"), displayName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if ((await ctx.db.get(args.pickId)) !== null) {
      await ctx.db.patch(args.pickId, { displayName: args.displayName });
    }
    return null;
  },
});

/**
 * Gives AI names to picks, for example new mock picks. A pick keeps its old
 * name when the model fails or suggestions are off.
 */
export const nameGeneratedPicks = internalAction({
  args: { pickIds: v.array(v.id("picks")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(internal.picks.getDisplayNameSettings, {});
    if (!settings.enabled) return null;
    const results = await Promise.allSettled(
      args.pickIds.map(async (pickId) => {
        const context = await ctx.runQuery(internal.picks.getPickNameContext, { pickId });
        if (context === null) return;
        const displayName = await generateDisplayName(context);
        await ctx.runMutation(internal.picks.setPickDisplayName, { pickId, displayName });
      }),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.warn("A pick did not get an AI name.", result.reason);
      }
    }
    return null;
  },
});
