import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  type ActionCtx,
  type QueryCtx,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  type DiscordMessageKind,
  getEventDiscordMessage,
  postDiscordMessage,
} from "./lib/events/discord";
import type { EventStatusNotification } from "./lib/events/types";
import { isStatusAdvance } from "./lib/mocks/mock_events";
import { discordMessageFields } from "./lib/mocks/validators";
import {
  assertCategoriesBelongToSeason,
  assertEventDoesNotExistForSeason,
  getActiveSeason,
  getTeamSyncDetailsForEvent,
} from "./lib/events/data";
import { normalizeEventCode } from "./lib/events/normalize_event_code";
import {
  CLOSE_STEP_INDEX,
  getEventStatusTransitionTimestamps,
  scheduleEventStatusTransitions,
} from "./lib/events/scheduling";
import {
  sortCategoriesByText,
  sortEventsByStartDate,
  sortEventsForDashboard,
} from "./lib/events/sort";
import {
  canRefreshTeamsForEvent,
  syncEventTeams,
} from "./lib/events/team_sync";
import {
  categoryValidator,
  dashboardEventValidator,
  eventStatusNotificationValidator,
  eventStatusValidator,
  adminEventValidator,
  frcEventTeamValidator,
  seasonValidator,
  teamSyncDetailsValidator,
  teamSyncResultValidator,
  validateEventFields,
  validateEventPickSettings,
  canEditPickSettingsForEvent,
} from "./lib/events/validators";
import { getCurrentUser } from "./users";
import { getTeamsForYearAndCode } from "../src/lib/fetch/frc-events";

export const list = query({
  args: {},
  returns: v.object({
    activeSeason: v.union(seasonValidator, v.null()),
    globalCategories: v.array(categoryValidator),
    seasonCategories: v.array(categoryValidator),
    events: v.array(adminEventValidator),
    approvedPlayerCount: v.optional(v.number()),
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
        approvedPlayerCount: 0,
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
      events: await Promise.all(
        sortEventsByStartDate(events).map(async (event) => {
          const [eventTeams, picks] = await Promise.all([
            ctx.db
              .query("eventTeams")
              .withIndex("byEvent", (q) => q.eq("event", event._id))
              .collect(),
            ctx.db
              .query("picks")
              .withIndex("byEvent", (q) => q.eq("event", event._id))
              .collect(),
          ]);
          return { ...event, teamCount: eventTeams.length, pickCount: picks.length };
        }),
      ),
      approvedPlayerCount: (await ctx.db.query("users").collect()).filter(
        (user) => user.isApproved && user.isMock !== true,
      ).length,
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
    teams: v.array(frcEventTeamValidator),
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
    await syncEventTeams(ctx, eventId, args.teams);

    return eventId;
  },
});

export const updatePickSettings = mutation({
  args: {
    eventId: v.id("events"),
    numberOfTeamPicks: v.int64(),
    numberOfCategoryPicks: v.int64(),
    categories: v.array(v.id("categories")),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can update events.");
    }

    const event = await ctx.db.get(args.eventId);

    if (event === null) {
      throw new Error("Event not found.");
    }

    if (!canEditPickSettingsForEvent(event.status)) {
      throw new Error(
        "Pick settings can only be edited for upcoming events or open submissions.",
      );
    }

    validateEventPickSettings({
      numberOfTeamPicks: args.numberOfTeamPicks,
      numberOfCategoryPicks: args.numberOfCategoryPicks,
      categories: args.categories,
    });

    await assertCategoriesBelongToSeason(ctx, args.categories, event.season);

    await ctx.db.patch(args.eventId, {
      numberOfTeamPicks: args.numberOfTeamPicks,
      numberOfCategoryPicks: args.numberOfCategoryPicks,
      categories: args.categories,
    });

    return null;
  },
});

export const refreshTeams = mutation({
  args: {
    eventId: v.id("events"),
    teams: v.array(frcEventTeamValidator),
  },
  returns: teamSyncResultValidator,
  async handler(ctx, args) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can refresh event teams.");
    }

    const event = await ctx.db.get(args.eventId);

    if (event === null) {
      throw new Error("Event not found.");
    }

    if (!canRefreshTeamsForEvent(event.status)) {
      throw new Error(
        "Teams can only be refreshed for upcoming events or open submissions.",
      );
    }

    return await syncEventTeams(ctx, args.eventId, args.teams);
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
    if (event === null) return null;

    await notifyDiscord(ctx, event, "SUBMISSIONS_OPEN");
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
    if (event === null) return null;

    try {
      const teamSyncDetails = await ctx.runQuery(
        internal.events.getTeamSyncDetails,
        {
          eventId: args.eventId,
        },
      );
      const teams = await getTeamsForYearAndCode({
        year: teamSyncDetails.seasonYear,
        eventCode: teamSyncDetails.eventCode,
      });

      await ctx.runMutation(internal.events.syncTeams, {
        eventId: args.eventId,
        teams,
      });
    } catch (error) {
      console.warn("Unable to refresh event teams before closing submissions.", {
        eventId: args.eventId,
        error,
      });
    }

    await notifyDiscord(ctx, event, "SUBMISSIONS_CLOSED");
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
    if (event === null) return null;

    await notifyDiscord(ctx, event, "ONGOING");
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
    if (event === null) return null;

    await notifyDiscord(ctx, event, "PICK_REMINDER");
    return null;
  },
});

/**
 * Sends a message to DISCORD_WEBHOOK_URL and logs it. Mock events use the
 * same webhook. A failed send still throws, so the scheduler shows it.
 */
async function notifyDiscord(
  ctx: ActionCtx,
  event: EventStatusNotification,
  kind: DiscordMessageKind,
) {
  const message = getEventDiscordMessage(kind, event);
  const url = process.env.DISCORD_WEBHOOK_URL;
  let error: string | undefined;

  if (url === undefined) {
    error = "DISCORD_WEBHOOK_URL is not configured.";
  } else {
    try {
      await postDiscordMessage(url, message);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "The Discord webhook failed.";
    }
  }

  await ctx.runMutation(internal.events.logDiscordMessage, {
    event: event._id,
    eventName: event.displayName,
    kind,
    content: message.content,
    title: message.embeds[0].title,
    description: message.embeds[0].description,
    isMock: event.isMock,
    status: error === undefined ? "sent" : "failed",
    ...(error === undefined ? {} : { error }),
  });

  if (error !== undefined) {
    throw new Error(error);
  }
}

export const logDiscordMessage = internalMutation({
  args: discordMessageFields,
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("discordMessages", args);
    return null;
  },
});

/**
 * Moves an event forward to a status. Returns null, and changes nothing, when
 * the event was deleted or is already at or after that status.
 */
export const setStatus = internalMutation({
  args: {
    eventId: v.id("events"),
    status: eventStatusValidator,
  },
  returns: v.union(eventStatusNotificationValidator, v.null()),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (event === null || !isStatusAdvance(event.status, args.status)) {
      return null;
    }

    await ctx.db.patch(args.eventId, {
      status: args.status,
    });

    return await toNotification(ctx, { ...event, status: args.status });
  },
});

export const getForNotification = internalQuery({
  args: {
    eventId: v.id("events"),
  },
  returns: v.union(eventStatusNotificationValidator, v.null()),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    return event === null ? null : await toNotification(ctx, event);
  },
});

async function toNotification(
  ctx: QueryCtx,
  event: Doc<"events">,
): Promise<EventStatusNotification> {
  return {
    name: event.name,
    submissionsCloseAt: await getSubmissionsCloseAt(ctx, event),
    _id: event._id,
    displayName: event.displayName,
    eventCode: event.eventCode,
    startDate: event.startDate,
    endDate: event.endDate,
    status: event.status,
    isMock: event.mock !== undefined,
  };
}

/**
 * When submissions close. A mock event closes at its scheduled close step.
 * A real event closes at its normal time.
 */
async function getSubmissionsCloseAt(ctx: QueryCtx, event: Doc<"events">) {
  const closeJobId = event.mock?.scheduledJobs[CLOSE_STEP_INDEX];
  const closeJob = closeJobId === undefined ? null : await ctx.db.system.get(closeJobId);
  return (
    closeJob?.scheduledTime ??
    getEventStatusTransitionTimestamps({
      startDate: event.startDate,
      endDate: event.endDate,
    }).submissionsClosed
  );
}

export const getTeamSyncDetails = internalQuery({
  args: {
    eventId: v.id("events"),
  },
  returns: teamSyncDetailsValidator,
  handler: async (ctx, args) => {
    return await getTeamSyncDetailsForEvent(ctx, args.eventId);
  },
});

export const syncTeams = internalMutation({
  args: {
    eventId: v.id("events"),
    teams: v.array(frcEventTeamValidator),
  },
  returns: teamSyncResultValidator,
  handler: async (ctx, args) => {
    return await syncEventTeams(ctx, args.eventId, args.teams);
  },
});
