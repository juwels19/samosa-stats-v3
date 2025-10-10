import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    isAdmin: v.boolean(),
    isApprover: v.boolean(),
    isApproved: v.boolean(),
  }).index("byExternalId", ["externalId"]),
  seasons: defineTable({
    year: v.number(),
    gameName: v.string(),
    isActive: v.boolean()
  }),
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