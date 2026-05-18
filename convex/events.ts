import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { EVENT_STATUS_SORT_ORDER } from "./lib/events/constants";
import {
  getEventStatusDiscordMessage,
  getPickSubmissionReminderDiscordMessage,
  sendDiscordMessage,
} from "./lib/events/discord";
import {
  getEventStatusTransitionTimestamps,
  scheduleEventStatusTransitions,
} from "./lib/events/scheduling";
import type { EventStatus } from "./lib/events/types";
import {
  categoryValidator,
  dashboardEventValidator,
  eventStatusNotificationValidator,
  eventStatusValidator,
  eventValidator,
  seasonValidator,
  validateEventFields,
} from "./lib/events/validators";
import { getCurrentUser } from "./users";

export const list = query({
  args: {},
  returns: v.object({
    activeSeason: v.union(seasonValidator, v.null()),
    globalCategories: v.array(categoryValidator),
    seasonCategories: v.array(categoryValidator),
    events: v.array(eventValidator),
  }),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can view events.");
    }

    const activeSeason = await getActiveSeason(ctx);

    if (activeSeason === null) {
      return {
        activeSeason,
        globalCategories: [],
        seasonCategories: [],
        events: [],
      };
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("bySeason", (q) => q.eq("season", activeSeason._id))
      .collect();
    const events = await ctx.db
      .query("events")
      .withIndex("bySeason", (q) => q.eq("season", activeSeason._id))
      .collect();

    return {
      activeSeason,
      globalCategories: sortCategoriesByText(
        categories.filter((category) => category.isGlobal),
      ),
      seasonCategories: sortCategoriesByText(
        categories.filter((category) => !category.isGlobal),
      ),
      events: sortEventsByStartDate(events),
    };
  },
});

export const listForDashboard = query({
  args: {},
  returns: v.object({
    activeSeason: v.union(seasonValidator, v.null()),
    events: v.array(dashboardEventValidator),
  }),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("Sign in to view dashboard events.");
    }

    if (!currentUser.isApproved && !currentUser.isAdmin) {
      throw new Error("Approved access is required to view dashboard events.");
    }

    const activeSeason = await getActiveSeason(ctx);

    if (activeSeason === null) {
      return {
        activeSeason,
        events: [],
      };
    }

    const events = await ctx.db
      .query("events")
      .withIndex("bySeason", (q) => q.eq("season", activeSeason._id))
      .collect();

    const eventsWithSubmittedPicks = await Promise.all(
      events.map(async (event) => {
        const pick = await ctx.db
          .query("picks")
          .withIndex("byUserAndEvent", (q) =>
            q.eq("user", currentUser._id).eq("event", event._id),
          )
          .first();

        return {
          ...event,
          hasSubmittedPicks: pick !== null,
        };
      }),
    );

    return {
      activeSeason,
      events: sortEventsForDashboard(eventsWithSubmittedPicks),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    eventCode: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    numberOfTeamPicks: v.int64(),
    numberOfCategoryPicks: v.int64(),
    categories: v.array(v.id("categories")),
  },
  returns: v.id("events"),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can create events.");
    }

    const activeSeason = await getActiveSeason(ctx);

    if (activeSeason === null) {
      throw new Error("Choose an active season before adding events.");
    }

    const name = args.name.trim();
    const displayName = args.displayName.trim();
    const eventCode = normalizeEventCode(args.eventCode);
    const startDate = args.startDate.trim();
    const endDate = args.endDate.trim();

    validateEventFields({
      name,
      displayName,
      eventCode,
      startDate,
      endDate,
      numberOfTeamPicks: args.numberOfTeamPicks,
      numberOfCategoryPicks: args.numberOfCategoryPicks,
      categories: args.categories,
    });

    await assertEventDoesNotExistForSeason(ctx, eventCode, activeSeason._id);
    await assertCategoriesBelongToSeason(ctx, args.categories, activeSeason._id);

    const transitionTimestamps = getEventStatusTransitionTimestamps({
      startDate,
      endDate,
    });
    const eventId = await ctx.db.insert("events", {
      name,
      displayName,
      season: activeSeason._id,
      eventCode,
      startDate,
      endDate,
      numberOfTeamPicks: args.numberOfTeamPicks,
      numberOfCategoryPicks: args.numberOfCategoryPicks,
      categories: args.categories,
      status: "UPCOMING",
    });

    await scheduleEventStatusTransitions(ctx, {
      eventId,
      transitionTimestamps,
    });

    return eventId;
  },
});

export const announceSubmissionsOpen = internalAction({
  args: {
    eventId: v.id("events"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.runMutation(internal.events.setStatus, {
      eventId: args.eventId,
      status: "SUBMISSIONS_OPEN",
    });

    await sendDiscordMessage({
      content: getEventStatusDiscordMessage(event),
    });

    return null;
  },
});

export const announceSubmissionsClosed = internalAction({
  args: {
    eventId: v.id("events"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.runMutation(internal.events.setStatus, {
      eventId: args.eventId,
      status: "SUBMISSIONS_CLOSED",
    });

    await sendDiscordMessage({
      content: getEventStatusDiscordMessage(event),
    });

    return null;
  },
});

export const announceOngoing = internalAction({
  args: {
    eventId: v.id("events"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.runMutation(internal.events.setStatus, {
      eventId: args.eventId,
      status: "ONGOING",
    });

    await sendDiscordMessage({
      content: getEventStatusDiscordMessage(event),
    });

    return null;
  },
});

export const sendPickSubmissionReminder = internalAction({
  args: {
    eventId: v.id("events"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.runQuery(internal.events.getForNotification, {
      eventId: args.eventId,
    });

    await sendDiscordMessage({
      content: getPickSubmissionReminderDiscordMessage(event),
    });

    return null;
  },
});

export const setStatus = internalMutation({
  args: {
    eventId: v.id("events"),
    status: eventStatusValidator,
  },
  returns: eventStatusNotificationValidator,
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (event === null) {
      throw new Error("Event not found.");
    }

    await ctx.db.patch(args.eventId, {
      status: args.status,
    });

    return {
      _id: event._id,
      displayName: event.displayName,
      eventCode: event.eventCode,
      startDate: event.startDate,
      endDate: event.endDate,
      status: args.status,
    };
  },
});

export const getForNotification = internalQuery({
  args: {
    eventId: v.id("events"),
  },
  returns: eventStatusNotificationValidator,
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (event === null) {
      throw new Error("Event not found.");
    }

    return {
      _id: event._id,
      displayName: event.displayName,
      eventCode: event.eventCode,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
    };
  },
});

async function getActiveSeason(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("seasons")
    .withIndex("byIsActive", (q) => q.eq("isActive", true))
    .first();
}

async function assertEventDoesNotExistForSeason(
  ctx: MutationCtx,
  eventCode: string,
  seasonId: Id<"seasons">,
) {
  const existingEvent = await ctx.db
    .query("events")
    .withIndex("bySeasonAndEventCode", (q) =>
      q.eq("season", seasonId).eq("eventCode", eventCode),
    )
    .unique();

  if (existingEvent !== null) {
    throw new Error(`Event "${eventCode}" already exists for the active season.`);
  }
}

async function assertCategoriesBelongToSeason(
  ctx: MutationCtx,
  categoryIds: Id<"categories">[],
  seasonId: Id<"seasons">,
) {
  const uniqueCategoryIds = new Set(categoryIds);

  if (uniqueCategoryIds.size !== categoryIds.length) {
    throw new Error("Selected categories must be unique.");
  }

  for (const categoryId of uniqueCategoryIds) {
    const category = await ctx.db.get(categoryId);

    if (category === null || category.season !== seasonId) {
      throw new Error("Selected categories must belong to the active season.");
    }
  }
}

function normalizeEventCode(eventCode: string) {
  return eventCode.trim().toUpperCase();
}

function sortCategoriesByText<TCategory extends { text: string }>(
  categories: TCategory[],
) {
  return categories.toSorted((a, b) => a.text.localeCompare(b.text));
}

function sortEventsByStartDate<TEvent extends { startDate: string }>(
  events: TEvent[],
) {
  return events.toSorted((a, b) => a.startDate.localeCompare(b.startDate));
}

function sortEventsForDashboard<
  TEvent extends {
    status: EventStatus;
    startDate: string;
    displayName: string;
  },
>(events: TEvent[]) {
  return events.toSorted((a, b) => {
    const statusOrder =
      EVENT_STATUS_SORT_ORDER[a.status] - EVENT_STATUS_SORT_ORDER[b.status];

    if (statusOrder !== 0) {
      return statusOrder;
    }

    const startDateOrder = a.startDate.localeCompare(b.startDate);

    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    return a.displayName.localeCompare(b.displayName);
  });
}
