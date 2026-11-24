"use client";

import { Skeleton } from "@heroui/react";
import { useQuery } from "convex/react";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDateRange } from "@/components/events/utils";
import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import EventStatusDot from "@/components/settings/seasons/events/event-status-dot";
import { getEventScoresRoute } from "@/lib/routes";
import { api } from "../../../convex/_generated/api";

/** The events in the active season, each linked to its scores. */
export default function ScoresEventList() {
  const currentUser = useCurrentUser();
  const data = useQuery(
    api.events.list,
    currentUser.user?.isAdmin ? {} : "skip",
  );
  const events = data?.events ?? [];

  const header = (
    <SettingsPageHeader
      title="Scores"
      description={
        data?.activeSeason
          ? `Category winners for the ${data.activeSeason.year} season`
          : "Category winners for the active season"
      }
    />
  );

  if (currentUser.isLoading || (currentUser.user?.isAdmin && data === undefined)) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!currentUser.user?.isAdmin || data === undefined) {
    return <p className="text-sm text-muted">You must be an admin to view scores.</p>;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className="py-10 text-center text-sm text-muted">
          The active season has no events.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}
      <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface">
        {events.map((event) => (
          <li key={event._id}>
            <Link
              href={getEventScoresRoute(event._id)}
              className="flex min-h-16 items-center gap-3 py-3 pr-3 pl-4 transition-colors duration-150 ease-out hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">{event.displayName}</span>
                <span className="truncate text-xs text-muted tabular-nums">
                  {event.eventCode} ·{" "}
                  {formatDateRange(event.startDate, event.endDate)}
                  {event.pickCount !== undefined
                    ? ` · ${event.pickCount} ${event.pickCount === 1 ? "submission" : "submissions"}`
                    : ""}
                </span>
              </div>
              <EventStatusDot status={event.status} className="text-sm text-muted" />
              <ChevronRightIcon className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
