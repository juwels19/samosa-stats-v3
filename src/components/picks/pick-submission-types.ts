import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type PickSubmissionEvent = Omit<Doc<"events">, "categories" | "season">;

export type PickSubmissionTeam = Doc<"teams">;

export type PickSubmissionCategory = Doc<"categories">;

export type ExistingPickSubmission = {
  _id: Id<"picks">;
  _creationTime: number;
  displayName?: string;
  isRandom: boolean;
  selectedTeamIds: Id<"teams">[];
  selectedCategoryIds: Id<"categories">[];
};

export type PickSubmissionData = {
  event: PickSubmissionEvent;
  teams: PickSubmissionTeam[];
  categories: PickSubmissionCategory[];
  existingPick: ExistingPickSubmission | null;
  canSubmitManual: boolean;
  canSubmitRandom: boolean;
};
