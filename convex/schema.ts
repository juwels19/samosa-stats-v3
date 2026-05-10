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
    isActive: v.boolean()
  })
    .index("byYear", ["year"])
    .index("byIsActive", ["isActive"]),
  events: defineTable({
    name: v.string(),
    displayName: v.string(),
    season: v.id('seasons'),
    eventCode: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    numberOfTeamPicks: v.int64(),
    numberOfCategoryPicks: v.int64(),
    isComplete: v.boolean(),
    isOngoing: v.boolean(),
    isSubmissionClosed: v.boolean(),
    isCountdownActive: v.boolean(),
  }),
  teams: defineTable({
    name: v.string(),
    number: v.int64()
  }),
  categories: defineTable({
    label: v.string(),
    season: v.id("seasons"),
    isGlobal: v.boolean()
  }),
  picks: defineTable({
    event: v.id('events'),
    user: v.id('users'),
    userFullName: v.string(),
    displayName: v.optional(v.string()),
    isRandom: v.boolean(),
    score: v.number(),
    rank: v.int64(),
    teams: v.array(v.id('categories')),
    categories: v.array(v.id('categories'))
  })
})