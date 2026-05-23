import { v } from "convex/values";

import { categoryValidator, eventStatusValidator } from "../events/validators";

export const pickTeamValidator = v.object({
  _id: v.id("teams"),
  _creationTime: v.number(),
  name: v.string(),
  number: v.int64(),
});

export const pickSubmissionEventValidator = v.object({
  _id: v.id("events"),
  _creationTime: v.number(),
  name: v.string(),
  displayName: v.string(),
  eventCode: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  numberOfTeamPicks: v.int64(),
  numberOfCategoryPicks: v.int64(),
  status: eventStatusValidator,
});

export const existingPickValidator = v.object({
  _id: v.id("picks"),
  _creationTime: v.number(),
  displayName: v.optional(v.string()),
  isRandom: v.boolean(),
  selectedTeamIds: v.array(v.id("teams")),
  selectedCategoryIds: v.array(v.id("categories")),
});

export const pickSubmissionDataValidator = v.union(
  v.object({
    event: pickSubmissionEventValidator,
    teams: v.array(pickTeamValidator),
    categories: v.array(categoryValidator),
    existingPick: v.union(existingPickValidator, v.null()),
    canSubmitManual: v.boolean(),
    canSubmitRandom: v.boolean(),
  }),
  v.null(),
);
