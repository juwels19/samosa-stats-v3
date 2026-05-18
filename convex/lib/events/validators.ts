import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

export const seasonValidator = v.object({
  _id: v.id("seasons"),
  _creationTime: v.number(),
  year: v.number(),
  gameName: v.string(),
  isActive: v.boolean(),
});

export const categoryValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  text: v.string(),
  scoringDescription: v.string(),
  season: v.id("seasons"),
  isGlobal: v.boolean(),
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
});

export const eventStatusNotificationValidator = v.object({
  _id: v.id("events"),
  displayName: v.string(),
  eventCode: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  status: eventStatusValidator,
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
  hasSubmittedPicks: v.boolean(),
});