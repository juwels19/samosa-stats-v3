import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
  })
    .index("byExternalId", ["externalId"])
    .index("byNormalizedEmail", ["normalizedEmail"])
    .index("byWaitlistEntryId", ["waitlistEntryId"]),
  seasons: defineTable({
    year: v.number(),
    gameName: v.string(),
    isActive: v.boolean(),
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
})