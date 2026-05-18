import type { Doc } from "../../../convex/_generated/dataModel";

export type EventCardEvent = Doc<"events"> & {
  hasSubmittedPicks?: boolean;
};
