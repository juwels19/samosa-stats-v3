import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import * as z from "zod";

export const createEventDetailsSchema = z.object({
  eventCode: z
    .string()
    .trim()
    .min(2, "Enter an event code.")
    .regex(/^[a-zA-Z0-9]+$/, "Use only letters and numbers."),
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(80, "Display name must be 80 characters or fewer."),
  numberOfTeamPicks: z
    .string()
    .regex(/^[1-9]\d*$/, "Enter a positive whole number."),
  numberOfCategoryPicks: z
    .string()
    .regex(/^[1-9]\d*$/, "Enter a positive whole number."),
});

export type LoadedFrcEvent = {
  eventCode: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type CreateEventModalData = z.infer<typeof createEventDetailsSchema> & {
  loadedEvent: LoadedFrcEvent | null;
  selectedCategoryIds: Id<"categories">[];
  hasSubmittedDetails: boolean;
  hasSubmittedCategories: boolean;
};

export const EVENT_MODAL_STEP_COUNT = 3;

export const EVENT_STATUS_LABELS: Record<Doc<"events">["status"], string> = {
  UPCOMING: "Upcoming",
  SUBMISSIONS_OPEN: "Submissions open",
  SUBMISSIONS_CLOSED: "Submissions closed",
  ONGOING: "Ongoing",
  COMPLETE: "Complete",
};
