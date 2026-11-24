import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
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
