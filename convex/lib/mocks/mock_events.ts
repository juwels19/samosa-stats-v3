import type { EventStatus, EventStatusTransitionTimestamps } from "../events/types";

/**
 * Mock tools are for testing. They work only on a deployment where the
 * Convex env MOCKS_ENABLED is "true". See "Mocks" in docs/testing.md.
 */
export function areMocksEnabled() {
  return process.env.MOCKS_ENABLED === "true";
}

export const MOCK_INTERVAL_MINUTES = { min: 1, max: 60, default: 2 } as const;
export const MAX_MOCK_PICKS_PER_CALL = 50;

/**
 * The status changes of a mock event, one interval apart from `now`, in the
 * same order as a real event.
 */
export function getMockTransitionTimestamps(
  now: number,
  intervalMinutes: number,
): EventStatusTransitionTimestamps {
  const step = intervalMinutes * 60_000;
  return {
    submissionsOpen: now + step,
    pickSubmissionReminder: now + 2 * step,
    submissionsClosed: now + 3 * step,
    ongoing: now + 4 * step,
    complete: now + 5 * step,
  };
}

/** `ONOSH` to `ONOSHMOCK1`, or the next free number. */
export function getMockEventCode(
  sourceEventCode: string,
  existingEventCodes: ReadonlySet<string>,
) {
  for (let n = 1; ; n += 1) {
    const code = `${sourceEventCode}MOCK${n}`;
    if (!existingEventCodes.has(code)) return code;
  }
}

const STATUS_ORDER: Record<EventStatus, number> = {
  UPCOMING: 0,
  SUBMISSIONS_OPEN: 1,
  SUBMISSIONS_CLOSED: 2,
  ONGOING: 3,
  COMPLETE: 4,
};

/**
 * True when `next` is after `current`. A status never moves back, so a
 * scheduled change that runs after a manual one does nothing.
 */
export function isStatusAdvance(current: EventStatus, next: EventStatus) {
  return STATUS_ORDER[next] > STATUS_ORDER[current];
}
