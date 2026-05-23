import type { PickSubmissionEvent } from "./pick-submission-types";

export function arePicksFieldsDisabled(event: PickSubmissionEvent) {
  return (
    event.status === "SUBMISSIONS_CLOSED" ||
    event.status === "ONGOING" ||
    event.status === "COMPLETE"
  );
}
