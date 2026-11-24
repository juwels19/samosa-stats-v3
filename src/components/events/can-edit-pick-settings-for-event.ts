import type { Doc } from "../../../convex/_generated/dataModel";

export function canEditPickSettingsForEvent(status: Doc<"events">["status"]) {
  return status === "UPCOMING" || status === "SUBMISSIONS_OPEN";
}
