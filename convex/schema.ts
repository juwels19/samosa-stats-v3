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
  })
})