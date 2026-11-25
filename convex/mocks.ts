import { v } from "convex/values";
import { formatInTimeZone } from "date-fns-tz";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { EVENT_TIME_ZONE } from "./lib/events/constants";
import { getActiveSeason } from "./lib/events/data";
import { scheduleEventStatusTransitions } from "./lib/events/scheduling";
import { sortEventsByStartDate } from "./lib/events/sort";
import { eventStatusValidator } from "./lib/events/validators";
import {
  areMocksEnabled,
  getMockEventCode,
  getMockTransitionTimestamps,
  MAX_MOCK_PICKS_PER_CALL,
  MOCK_INTERVAL_MINUTES,
} from "./lib/mocks/mock_events";
import {
  discordMessageFields,
  mockEventValidator,
  mockStepValidator,
} from "./lib/mocks/validators";
import {
  randomizeIsRandom,
  randomizePickSelections,
} from "./lib/picks/randomize_pick_selections";
import { replacePickSelections } from "./lib/picks/replace_pick_selections";
import { getCurrentUser } from "./users";

/**
 * Test tools: mock players and picks, mock events, and the Discord log.
 * Every function refuses to run unless MOCKS_ENABLED is "true", so they do
 * nothing in production.
 */

/** True on a deployment with the test tools. The app hides them otherwise. */
export const isEnabled = query({
  args: {},
  returns: v.boolean(),
  handler: () => areMocksEnabled(),
});

const MESSAGE_LOG_LIMIT = 30;

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const currentUser = await getCurrentUser(ctx);
  if (!currentUser?.isAdmin) {
    throw new Error("Only admins can use mock tools.");
  }
}

async function requireMockAdmin(ctx: QueryCtx | MutationCtx) {
  await requireAdmin(ctx);
  if (!areMocksEnabled()) {
    throw new Error("Mocks are off on this deployment. Set MOCKS_ENABLED=true.");
  }
}

async function getMockUsers(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("users")
    .withIndex("byIsMock", (q) => q.eq("isMock", true))
    .collect();
}

async function getEventOrThrow(ctx: QueryCtx | MutationCtx, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (event === null) throw new Error("Event not found.");
  return event;
}

async function getMockEventOrThrow(ctx: MutationCtx, eventId: Id<"events">) {
  const event = await getEventOrThrow(ctx, eventId);
  if (event.mock === undefined) {
    throw new Error("This action is only for mock events.");
  }
  return { ...event, mock: event.mock };
}

const scheduledStepValidator = v.object({
  name: v.string(),
  scheduledTime: v.number(),
  state: v.string(),
});

export const overview = query({
  args: {},
  returns: v.object({
    mockPlayerCount: v.number(),
    events: v.array(
      v.object({
        _id: v.id("events"),
        displayName: v.string(),
        eventCode: v.string(),
        status: eventStatusValidator,
        mock: v.optional(mockEventValidator),
        teamCount: v.number(),
        pickCount: v.number(),
        mockPickCount: v.number(),
        steps: v.array(scheduledStepValidator),
      }),
    ),
    messages: v.array(
      v.object({ _id: v.id("discordMessages"), _creationTime: v.number(), ...discordMessageFields }),
    ),
  }),
  handler: async (ctx) => {
    await requireMockAdmin(ctx);
    const season = await getActiveSeason(ctx);
    const mockUsers = await getMockUsers(ctx);
    const mockUserIds = new Set(mockUsers.map((user) => user._id));
    const events =
      season === null
        ? []
        : await ctx.db
            .query("events")
            .withIndex("bySeason", (q) => q.eq("season", season._id))
            .collect();

    return {
      mockPlayerCount: mockUsers.length,
      events: await Promise.all(
        sortEventsByStartDate(events).map(async (event) => {
          const [teams, picks, steps] = await Promise.all([
            ctx.db
              .query("eventTeams")
              .withIndex("byEvent", (q) => q.eq("event", event._id))
              .collect(),
            ctx.db
              .query("picks")
              .withIndex("byEvent", (q) => q.eq("event", event._id))
              .collect(),
            Promise.all(
              (event.mock?.scheduledJobs ?? []).map(async (jobId) => {
                const job = await ctx.db.system.get(jobId);
                return job === null
                  ? []
                  : [{ name: job.name, scheduledTime: job.scheduledTime, state: job.state.kind }];
              }),
            ),
          ]);
          return {
            _id: event._id,
            displayName: event.displayName,
            eventCode: event.eventCode,
            status: event.status,
            ...(event.mock === undefined ? {} : { mock: event.mock }),
            teamCount: teams.length,
            pickCount: picks.length,
            mockPickCount: picks.filter((pick) => mockUserIds.has(pick.user)).length,
            steps: steps.flat(),
          };
        }),
      ),
      messages: await ctx.db.query("discordMessages").order("desc").take(MESSAGE_LOG_LIMIT),
    };
  },
});

/**
 * Gives random picks to mock players that have no pick for the event yet.
 * Makes more mock players when there are not enough.
 */
export const addMockPicks = mutation({
  args: { eventId: v.id("events"), count: v.number() },
  returns: v.object({ added: v.number() }),
  handler: async (ctx, args) => {
    await requireMockAdmin(ctx);
    if (!Number.isInteger(args.count) || args.count < 1 || args.count > MAX_MOCK_PICKS_PER_CALL) {
      throw new Error(`Add 1 to ${MAX_MOCK_PICKS_PER_CALL} mock picks at a time.`);
    }
    const event = await getEventOrThrow(ctx, args.eventId);

    const [eventTeams, categories, picks] = await Promise.all([
      ctx.db
        .query("eventTeams")
        .withIndex("byEvent", (q) => q.eq("event", event._id))
        .collect(),
      Promise.all(event.categories.map(async (id) => await ctx.db.get(id))),
      ctx.db
        .query("picks")
        .withIndex("byEvent", (q) => q.eq("event", event._id))
        .collect(),
    ]);
    const teamIds = eventTeams.map((row) => row.team);
    const known = categories.filter((category) => category !== null);
    const globalIds = known.filter((c) => c.isGlobal).map((c) => c._id);
    const selectableIds = known.filter((c) => !c.isGlobal).map((c) => c._id);
    const teamCount = Number(event.numberOfTeamPicks);
    const categoryCount = Number(event.numberOfCategoryPicks);

    if (teamIds.length < teamCount || selectableIds.length < categoryCount) {
      throw new Error("This event does not have enough teams or categories yet.");
    }

    const usersWithPicks = new Set(picks.map((pick) => pick.user));
    const mockUsers = (await getMockUsers(ctx)).toSorted(
      (a, b) => a._creationTime - b._creationTime,
    );
    const players: Doc<"users">[] = mockUsers.filter((user) => !usersWithPicks.has(user._id));
    for (let n = mockUsers.length + 1; players.length < args.count; n += 1) {
      const userId = await ctx.db.insert("users", {
        firstName: "Mock",
        lastName: `player ${n}`,
        email: `mock-player-${n}@mock.invalid`,
        isAdmin: false,
        isApprover: false,
        isApproved: false,
        isMock: true,
      });
      const user = await ctx.db.get(userId);
      if (user !== null) players.push(user);
    }

    const pickIds: Id<"picks">[] = [];
    for (const player of players.slice(0, args.count)) {
      const categoryIds = [
        ...globalIds,
        ...randomizePickSelections({ ids: selectableIds, count: categoryCount }),
      ];
      const pickId = await ctx.db.insert("picks", {
        event: event._id,
        user: player._id,
        displayName: `${player.firstName} ${player.lastName}`,
        isRandom: randomizeIsRandom(),
        categories: categoryIds,
      });
      await replacePickSelections(ctx, {
        pickId,
        teamIds: randomizePickSelections({ ids: teamIds, count: teamCount }),
        categoryIds,
      });
      pickIds.push(pickId);
    }

    // The mock player name stays until the AI name arrives, or when it fails.
    await ctx.scheduler.runAfter(0, internal.picks.nameGeneratedPicks, { pickIds });

    return { added: args.count };
  },
});

async function deletePicks(ctx: MutationCtx, picks: Doc<"picks">[]) {
  for (const pick of picks) {
    await replacePickSelections(ctx, { pickId: pick._id, teamIds: [], categoryIds: [] });
    await ctx.db.delete(pick._id);
  }
}

export const clearMockPicks = mutation({
  args: { eventId: v.id("events") },
  returns: v.object({ removed: v.number() }),
  handler: async (ctx, args) => {
    await requireMockAdmin(ctx);
    const mockUserIds = new Set((await getMockUsers(ctx)).map((user) => user._id));
    const picks = (
      await ctx.db
        .query("picks")
        .withIndex("byEvent", (q) => q.eq("event", args.eventId))
        .collect()
    ).filter((pick) => mockUserIds.has(pick.user));
    await deletePicks(ctx, picks);
    return { removed: picks.length };
  },
});

/**
 * Copies a real event as a mock event: same teams, categories and pick
 * settings. Its status changes run one interval apart, starting from now.
 */
export const createMockEvent = mutation({
  args: { sourceEventId: v.id("events"), intervalMinutes: v.number() },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    await requireMockAdmin(ctx);
    const intervalMinutes = checkInterval(args.intervalMinutes);
    const source = await getEventOrThrow(ctx, args.sourceEventId);
    if (source.mock !== undefined) {
      throw new Error("Copy a real event, not a mock event.");
    }

    const seasonEvents = await ctx.db
      .query("events")
      .withIndex("bySeason", (q) => q.eq("season", source.season))
      .collect();
    const eventCode = getMockEventCode(
      source.eventCode,
      new Set(seasonEvents.map((event) => event.eventCode)),
    );
    const today = formatInTimeZone(Date.now(), EVENT_TIME_ZONE, "yyyy-MM-dd");

    const eventId = await ctx.db.insert("events", {
      name: source.name,
      displayName: `Mock: ${source.displayName}`,
      season: source.season,
      eventCode,
      startDate: today,
      endDate: today,
      numberOfTeamPicks: source.numberOfTeamPicks,
      numberOfCategoryPicks: source.numberOfCategoryPicks,
      categories: source.categories,
      status: "UPCOMING",
      mock: { sourceEventCode: source.eventCode, intervalMinutes, scheduledJobs: [] },
    });

    const sourceTeams = await ctx.db
      .query("eventTeams")
      .withIndex("byEvent", (q) => q.eq("event", source._id))
      .collect();
    for (const row of sourceTeams) {
      await ctx.db.insert("eventTeams", { event: eventId, team: row.team });
    }

    await scheduleMockFlow(ctx, eventId, intervalMinutes);
    return eventId;
  },
});

function checkInterval(intervalMinutes: number) {
  if (
    !Number.isInteger(intervalMinutes) ||
    intervalMinutes < MOCK_INTERVAL_MINUTES.min ||
    intervalMinutes > MOCK_INTERVAL_MINUTES.max
  ) {
    throw new Error(
      `The interval must be ${MOCK_INTERVAL_MINUTES.min} to ${MOCK_INTERVAL_MINUTES.max} minutes.`,
    );
  }
  return intervalMinutes;
}

async function scheduleMockFlow(
  ctx: MutationCtx,
  eventId: Id<"events">,
  intervalMinutes: number,
) {
  const scheduledJobs = await scheduleEventStatusTransitions(ctx, {
    eventId,
    transitionTimestamps: getMockTransitionTimestamps(Date.now(), intervalMinutes),
  });
  await ctx.db.patch(eventId, {
    mock: {
      ...(await getMockEventOrThrow(ctx, eventId)).mock,
      intervalMinutes,
      scheduledJobs,
    },
  });
}

async function cancelPendingJobs(ctx: MutationCtx, jobIds: Id<"_scheduled_functions">[]) {
  for (const jobId of jobIds) {
    const job = await ctx.db.system.get(jobId);
    if (job?.state.kind === "pending") {
      await ctx.scheduler.cancel(jobId);
    }
  }
}

/** Runs one step of a mock event now: the real action, with its Discord message. */
export const runMockStep = mutation({
  args: { eventId: v.id("events"), step: mockStepValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireMockAdmin(ctx);
    const event = await getMockEventOrThrow(ctx, args.eventId);
    switch (args.step) {
      case "SUBMISSIONS_OPEN":
        await ctx.scheduler.runAfter(0, internal.events.announceSubmissionsOpen, { eventId: event._id });
        break;
      case "PICK_REMINDER":
        await ctx.scheduler.runAfter(0, internal.events.sendPickSubmissionReminder, { eventId: event._id });
        break;
      case "SUBMISSIONS_CLOSED":
        await ctx.scheduler.runAfter(0, internal.events.announceSubmissionsClosed, { eventId: event._id });
        break;
      case "ONGOING":
        await ctx.scheduler.runAfter(0, internal.events.announceOngoing, { eventId: event._id });
        break;
      case "COMPLETE":
        await ctx.scheduler.runAfter(0, internal.events.setStatus, {
          eventId: event._id,
          status: "COMPLETE",
        });
        break;
    }
    return null;
  },
});

/** Sets a mock event back to UPCOMING and schedules its flow again from now. */
export const restartMockEvent = mutation({
  args: { eventId: v.id("events"), intervalMinutes: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireMockAdmin(ctx);
    const intervalMinutes = checkInterval(args.intervalMinutes);
    const event = await getMockEventOrThrow(ctx, args.eventId);
    await cancelPendingJobs(ctx, event.mock.scheduledJobs);
    await ctx.db.patch(event._id, { status: "UPCOMING" });
    await scheduleMockFlow(ctx, event._id, intervalMinutes);
    return null;
  },
});

/** Stops the scheduled steps of a mock event. Manual steps still work. */
export const pauseMockEvent = mutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireMockAdmin(ctx);
    const event = await getMockEventOrThrow(ctx, args.eventId);
    await cancelPendingJobs(ctx, event.mock.scheduledJobs);
    return null;
  },
});

/** Deletes a mock event with its teams, picks, winners and results. The Discord log stays. */
export const deleteMockEvent = mutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireMockAdmin(ctx);
    const event = await getMockEventOrThrow(ctx, args.eventId);
    await cancelPendingJobs(ctx, event.mock.scheduledJobs);

    const [teams, picks, winners, points, results, scores] = await Promise.all([
      ctx.db.query("eventTeams").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
      ctx.db.query("picks").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
      ctx.db.query("categoryWinners").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
      ctx.db.query("categoryPoints").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
      ctx.db.query("eventResults").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
      ctx.db.query("eventScores").withIndex("byEvent", (q) => q.eq("event", event._id)).collect(),
    ]);
    await deletePicks(ctx, picks);
    for (const row of [...teams, ...winners, ...points, ...results, ...scores]) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(event._id);
    return null;
  },
});

export const clearDiscordLog = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireMockAdmin(ctx);
    for (const message of await ctx.db.query("discordMessages").collect()) {
      await ctx.db.delete(message._id);
    }
    return null;
  },
});
