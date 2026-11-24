import { getEventStatusTransitionTimestamps } from "../../../convex/lib/events/scheduling";
import type { EventCardEvent } from "@/components/events/types";

export type DashboardEvent = EventCardEvent & {
  gatesCloseAt: number | null;
  submissionsOpenAt: number | null;
};

/** Adds the scheduler's open and close times, so the UI matches the jobs. */
export function withSchedule(event: EventCardEvent): DashboardEvent {
  try {
    const times = getEventStatusTransitionTimestamps({
      startDate: event.startDate,
      endDate: event.endDate,
    });
    return {
      ...event,
      gatesCloseAt: times.submissionsClosed,
      submissionsOpenAt: times.submissionsOpen,
    };
  } catch {
    return { ...event, gatesCloseAt: null, submissionsOpenAt: null };
  }
}

export function needsPicks(event: DashboardEvent) {
  return event.status === "SUBMISSIONS_OPEN" && !event.hasSubmittedPicks;
}

export function isLive(event: DashboardEvent) {
  return event.status === "ONGOING" || event.status === "SUBMISSIONS_CLOSED";
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function formatCloseTime(ms: number) {
  return new Date(ms).toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  });
}

export function formatShortDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Toronto",
  });
}

export { formatDateRange } from "@/components/events/utils";
