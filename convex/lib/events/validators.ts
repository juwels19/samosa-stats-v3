import { v } from "convex/values";
import { Doc, Id } from "../../_generated/dataModel";
import { mockEventValidator } from "../mocks/validators";
import {
  pointsSourceValidator,
  scoringScriptValidator,
  winnerSourceValidator,
} from "../scoring/validators";

export const seasonValidator = v.object({
  _id: v.id("seasons"),
  _creationTime: v.number(),
  year: v.number(),
  gameName: v.string(),
  isActive: v.boolean(),
  deductionAwardType: v.optional(v.number()),
});

export const categoryValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  text: v.string(),
  scoringDescription: v.string(),
  season: v.id("seasons"),
  isGlobal: v.boolean(),
  winnerSource: v.optional(winnerSourceValidator),
  valueFormula: v.optional(v.string()),
  pointsSource: v.optional(pointsSourceValidator),
  script: v.optional(scoringScriptValidator),
});

export const eventStatusValidator = v.union(
  v.literal("UPCOMING"),
  v.literal("SUBMISSIONS_OPEN"),
  v.literal("SUBMISSIONS_CLOSED"),
  v.literal("ONGOING"),
  v.literal("COMPLETE"),
);

export const eventValidator = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  name: v.string(),
  displayName: v.string(),
  season: v.id("seasons"),
  eventCode: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  numberOfTeamPicks: v.int64(),
  numberOfCategoryPicks: v.int64(),
  categories: v.array(v.id("categories")),
  status: eventStatusValidator,
  mock: v.optional(mockEventValidator),
});

/** Event plus the counts the admin events table shows. */
export const adminEventValidator = v.object({
  ...eventValidator.fields,
  teamCount: v.optional(v.number()),
  pickCount: v.optional(v.number()),
});

export const eventStatusNotificationValidator = v.object({
  _id: v.id("events"),
  displayName: v.string(),
  eventCode: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  status: eventStatusValidator,
  name: v.string(),
  isMock: v.boolean(),
  submissionsCloseAt: v.number(),
});

export const frcEventTeamValidator = v.object({
  name: v.string(),
  number: v.number(),
});

export const teamSyncResultValidator = v.object({
  savedTeamCount: v.number(),
});

export const teamSyncDetailsValidator = v.object({
  eventCode: v.string(),
  seasonYear: v.number(),
});

export function validateEventFields({
  name,
  displayName,
  eventCode,
  startDate,
  endDate,
  numberOfTeamPicks,
  numberOfCategoryPicks,
  categories,
}: {
  name: string;
  displayName: string;
  eventCode: string;
  startDate: string;
  endDate: string;
  numberOfTeamPicks: bigint;
  numberOfCategoryPicks: bigint;
  categories: Id<"categories">[];
}) {
  if (name.length === 0) {
    throw new Error("Official event name is required.");
  }

  if (displayName.length === 0) {
    throw new Error("Display name is required.");
  }

  if (eventCode.length === 0) {
    throw new Error("Event code is required.");
  }

  if (startDate.length === 0 || endDate.length === 0) {
    throw new Error("Event dates are required.");
  }

  if (numberOfTeamPicks <= BigInt(0)) {
    throw new Error("Number of team picks must be greater than zero.");
  }

  if (numberOfCategoryPicks <= BigInt(0)) {
    throw new Error("Number of category picks must be greater than zero.");
  }

  if (categories.length === 0) {
    throw new Error("Select at least one category.");
  }
}

export function validateEventPickSettings({
  numberOfTeamPicks,
  numberOfCategoryPicks,
  categories,
}: {
  numberOfTeamPicks: bigint;
  numberOfCategoryPicks: bigint;
  categories: Id<"categories">[];
}) {
  if (numberOfTeamPicks <= BigInt(0)) {
    throw new Error("Number of team picks must be greater than zero.");
  }

  if (numberOfCategoryPicks <= BigInt(0)) {
    throw new Error("Number of category picks must be greater than zero.");
  }

  if (categories.length === 0) {
    throw new Error("Select at least one category.");
  }
}

export function canEditPickSettingsForEvent(
  status: Doc<"events">["status"],
) {
  return status === "UPCOMING" || status === "SUBMISSIONS_OPEN";
}

export const dashboardEventValidator = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  name: v.string(),
  displayName: v.string(),
  season: v.id("seasons"),
  eventCode: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  numberOfTeamPicks: v.int64(),
  numberOfCategoryPicks: v.int64(),
  categories: v.array(v.id("categories")),
  status: eventStatusValidator,
  mock: v.optional(mockEventValidator),
  hasSubmittedPicks: v.boolean(),
});