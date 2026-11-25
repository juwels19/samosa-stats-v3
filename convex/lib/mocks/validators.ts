import { v } from "convex/values";

export const mockEventValidator = v.object({
  /** The real event this copies. Team refresh and scoring use its code. */
  sourceEventCode: v.string(),
  intervalMinutes: v.number(),
  /** The pending status changes, so a restart or delete can cancel them. */
  scheduledJobs: v.array(v.id("_scheduled_functions")),
});

export const discordMessageKindValidator = v.union(
  v.literal("SUBMISSIONS_OPEN"),
  v.literal("PICK_REMINDER"),
  v.literal("SUBMISSIONS_CLOSED"),
  v.literal("ONGOING"),
);

export const discordMessageFields = {
  event: v.id("events"),
  /** Kept so the log still reads after a mock event is deleted. */
  eventName: v.string(),
  kind: discordMessageKindValidator,
  /** The header line. */
  content: v.string(),
  /** The embed. Not set on messages logged before embeds were added. */
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  isMock: v.boolean(),
  status: v.union(v.literal("sent"), v.literal("failed")),
  error: v.optional(v.string()),
};

export const mockStepValidator = v.union(
  v.literal("SUBMISSIONS_OPEN"),
  v.literal("PICK_REMINDER"),
  v.literal("SUBMISSIONS_CLOSED"),
  v.literal("ONGOING"),
  v.literal("COMPLETE"),
);
