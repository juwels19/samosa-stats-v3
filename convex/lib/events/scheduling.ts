import {
  addDays,
  addYears,
  format,
  isValid,
  parseISO,
  subDays,
} from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import {
  STATUS_SCHEDULE_OFFSET_YEARS,
  EVENT_TIME_ZONE,
} from "./constants";
import type { EventStatusTransitionTimestamps } from "./types";

export async function scheduleEventStatusTransitions(
  ctx: MutationCtx,
  {
    eventId,
    transitionTimestamps,
  }: {
    eventId: Id<"events">;
    transitionTimestamps: EventStatusTransitionTimestamps;
  },
) {
  await ctx.scheduler.runAt(
    transitionTimestamps.submissionsOpen,
    internal.events.announceSubmissionsOpen,
    { eventId },
  );
  await ctx.scheduler.runAt(
    transitionTimestamps.pickSubmissionReminder,
    internal.events.sendPickSubmissionReminder,
    { eventId },
  );
  await ctx.scheduler.runAt(
    transitionTimestamps.submissionsClosed,
    internal.events.announceSubmissionsClosed,
    { eventId },
  );
  await ctx.scheduler.runAt(
    transitionTimestamps.ongoing,
    internal.events.announceOngoing,
    { eventId },
  );
  await ctx.scheduler.runAt(
    transitionTimestamps.complete,
    internal.events.setStatus,
    {
      eventId,
      status: "COMPLETE",
    },
  );
}

export function getEventStatusTransitionTimestamps({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): EventStatusTransitionTimestamps {
  const startDateOnly = parseEventDate(startDate, "start date");
  const endDateOnly = parseEventDate(endDate, "end date");
  const weekBeforeStartDate = subDays(startDateOnly, 7);
  const dayBeforeStartDate = subDays(startDateOnly, 1);
  const dayAfterStartDate = addDays(startDateOnly, 1);

  return {
    submissionsOpen: zonedDateTimeToTimestamp(weekBeforeStartDate, 10, 0),
    pickSubmissionReminder: zonedDateTimeToTimestamp(dayBeforeStartDate, 10, 0),
    submissionsClosed: zonedDateTimeToTimestamp(dayAfterStartDate, 9, 0),
    ongoing: zonedDateTimeToTimestamp(dayAfterStartDate, 12, 0),
    complete: zonedDateTimeToTimestamp(endDateOnly, 22, 0),
  };
}

function parseEventDate(date: string, label: string) {
  const parsedDate = parseISO(date.trim().slice(0, 10));

  if (!isValid(parsedDate)) {
    throw new Error(`Invalid event ${label}.`);
  }

  return parsedDate;
}

function zonedDateTimeToTimestamp(date: Date, hour: number, minute: number) {
  const offsetDate = addYears(date, STATUS_SCHEDULE_OFFSET_YEARS);
  const zonedDateTime = `${format(offsetDate, "yyyy-MM-dd")}T${formatTimePart(
    hour,
  )}:${formatTimePart(minute)}:00`;

  return fromZonedTime(zonedDateTime, EVENT_TIME_ZONE).getTime();
}

function formatTimePart(value: number) {
  return String(value).padStart(2, "0");
}
