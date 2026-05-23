import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  getEventSubmissionData,
  getGlobalCategoryIdsForEvent,
} from "./lib/picks/get_event_submission_data";
import { replacePickSelections } from "./lib/picks/replace_pick_selections";
import { validatePickSubmission } from "./lib/picks/validate_pick_submission";
import { pickSubmissionDataValidator } from "./lib/picks/validators";
import { getCurrentUser } from "./users";

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

function normalizeDisplayName(displayName: string | undefined) {
  const trimmedDisplayName = displayName?.trim();

  return trimmedDisplayName === "" ? undefined : trimmedDisplayName;
}
