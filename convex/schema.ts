import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  discordMessageFields,
  mockEventValidator,
} from "./lib/mocks/validators";
import {
  categoryWinnerResultValidator,
  winnerSourceValidator,
} from "./lib/scoring/validators";

export default defineSchema({
  users: defineTable({
    externalId: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    normalizedEmail: v.optional(v.string()),
    isAdmin: v.boolean(),
    isApprover: v.boolean(),
    isApproved: v.boolean(),
    waitlistEntryId: v.optional(v.string()),
    waitlistStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("invited"),
        v.literal("completed"),
        v.literal("rejected"),
      ),
    ),
    invitedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    /** A fake player that holds mock picks. Can't sign in. */
    isMock: v.optional(v.boolean()),
  })
    .index("byExternalId", ["externalId"])
    .index("byNormalizedEmail", ["normalizedEmail"])
    .index("byWaitlistEntryId", ["waitlistEntryId"])
    .index("byIsMock", ["isMock"]),
  seasons: defineTable({
    year: v.number(),
    gameName: v.string(),
    isActive: v.boolean(),
    /** TBA award type whose winners give the award deduction. */
    deductionAwardType: v.optional(v.number()),
  })
    .index("byYear", ["year"])
    .index("byIsActive", ["isActive"]),
  events: defineTable({
    name: v.string(),
    displayName: v.string(),
    season: v.id("seasons"),
    eventCode: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    numberOfTeamPicks: v.int64(),
    numberOfCategoryPicks: v.int64(),
    categories: v.array(v.id("categories")),
    status: v.union(
      v.literal("UPCOMING"),
      v.literal("SUBMISSIONS_OPEN"),
      v.literal("SUBMISSIONS_CLOSED"),
      v.literal("ONGOING"),
      v.literal("COMPLETE"),
    ),
    /** Set on a test copy of an event. See docs/testing.md. */
    mock: v.optional(mockEventValidator),
  })
    .index("bySeason", ["season"])
    .index("bySeasonAndEventCode", ["season", "eventCode"]),
  teams: defineTable({
    name: v.string(),
    number: v.int64(),
  }).index("byNumber", ["number"]),
  eventTeams: defineTable({
    event: v.id("events"),
    team: v.id("teams"),
  })
    .index("byEvent", ["event"])
    .index("byTeam", ["team"])
    .index("byEventAndTeam", ["event", "team"]),
  categories: defineTable({
    text: v.string(),
    scoringDescription: v.string(),
    season: v.id("seasons"),
    isGlobal: v.boolean(),
    /** Not set means the category has no scoring setup yet. */
    winnerSource: v.optional(winnerSourceValidator),
  })
    .index("bySeason", ["season"])
    .index("bySeasonAndIsGlobal", ["season", "isGlobal"]),
  picks: defineTable({
    event: v.id("events"),
    user: v.id("users"),
    displayName: v.optional(v.string()),
    isRandom: v.boolean(),
    categories: v.array(v.id("categories")),
  })
    .index("byEvent", ["event"])
    .index("byUserAndEvent", ["user", "event"]),
  pickTeams: defineTable({
    pick: v.id("picks"),
    team: v.id("teams"),
  })
    .index("byPick", ["pick"])
    .index("byTeam", ["team"])
    .index("byPickAndTeam", ["pick", "team"]),
  pickCategories: defineTable({
    pick: v.id("picks"),
    category: v.id("categories"),
  })
    .index("byPick", ["pick"])
    .index("byCategory", ["category"])
    .index("byPickAndCategory", ["pick", "category"]),
  /** The current winners of each category at an event. */
  categoryWinners: defineTable({
    event: v.id("events"),
    category: v.id("categories"),
    result: categoryWinnerResultValidator,
  })
    .index("byEvent", ["event"])
    .index("byEventAndCategory", ["event", "category"]),
  /** App-wide AI settings that admins change. One row; defaults when empty. */
  aiSettings: defineTable({
    displayNameSuggestions: v.object({ enabled: v.boolean() }),
  }),
  /** AI display name suggestions each player asked for, by event. */
  displayNameSuggestionCounts: defineTable({
    user: v.id("users"),
    event: v.id("events"),
    count: v.number(),
  }).index("byUserAndEvent", ["user", "event"]),
  /** Each Discord message an event sent, or would have sent. */
  discordMessages: defineTable(discordMessageFields).index("byEvent", ["event"]),
})