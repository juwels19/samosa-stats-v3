import type { FunctionReturnType } from "convex/server";

import { api } from "../../../../convex/_generated/api";

export type MocksOverview = FunctionReturnType<typeof api.mocks.overview>;
export type OverviewEvent = MocksOverview["events"][number];
export type DiscordMessage = MocksOverview["messages"][number];
export type MockStep = "SUBMISSIONS_OPEN" | "PICK_REMINDER" | "SUBMISSIONS_CLOSED" | "ONGOING" | "COMPLETE";

/** The steps of a mock event, in the order they are scheduled. */
export const MOCK_STEPS: { step: MockStep; label: string }[] = [
  { step: "SUBMISSIONS_OPEN", label: "Open submissions" },
  { step: "PICK_REMINDER", label: "Send reminder" },
  { step: "SUBMISSIONS_CLOSED", label: "Close submissions" },
  { step: "ONGOING", label: "Start event" },
  { step: "COMPLETE", label: "Complete" },
];

/** Gives a Convex error message without the request details. */
export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Try again.";
  const match = /Uncaught Error: (.*?)(?:\n|$)/.exec(error.message);
  return match?.[1] ?? error.message;
}
