"use client";

import { Skeleton } from "@heroui/react";
import { useConvexAuth, useQuery } from "convex/react";
import { CalendarDaysIcon } from "lucide-react";
import EmptyState from "@/components/common/empty-state";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import { isLive, needsPicks, withSchedule } from "./dashboard-event-utils";
import EventGroup from "./event-group";
import NeedsPicksCard from "./needs-picks-card";

export default function DashboardEvents() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const eventData = useQuery(
    api.events.listForDashboard,
    isAuthenticated ? {} : "skip",
  );

  const events = (eventData?.events ?? []).map(withSchedule);
  const toPick = events
    .filter(needsPicks)
    .sort((a, b) => (a.gatesCloseAt ?? Infinity) - (b.gatesCloseAt ?? Infinity));
  const now = useNow({ enabled: toPick.length > 0 });

  if (isLoading || eventData === undefined) {
    return (
      <Shell subtitle="Loading events">
        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="hidden h-64 rounded-3xl lg:block" />
          <Skeleton className="hidden h-64 rounded-3xl lg:block" />
        </div>
      </Shell>
    );
  }

  if (eventData.activeSeason === null || events.length === 0) {
    return (
      <Shell subtitle="No events yet">
        <EmptyState
          icon={<CalendarDaysIcon />}
          title="No events yet"
          description="Events show here after they are added to the active season."
        />
      </Shell>
    );
  }

  const live = events.filter(isLive);
  const comingUp = events.filter(
    (e) =>
      (e.status === "SUBMISSIONS_OPEN" && e.hasSubmittedPicks) || e.status === "UPCOMING",
  );
  const finished = events.filter((e) => e.status === "COMPLETE");

  const subtitle =
    toPick.length === 0
      ? "You are all caught up"
      : toPick.length === 1
        ? "1 event needs your picks"
        : `${toPick.length} events need your picks`;

  return (
    <Shell subtitle={subtitle}>
      {toPick.length > 0 ? (
        <section aria-label="Events that need your picks" className="flex flex-col gap-3">
          <ul
            className={cn(
              "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6",
              "lg:mx-0 lg:grid lg:snap-none lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0",
              toPick.length === 1 && "lg:grid-cols-2",
            )}
          >
            {toPick.map((event, index) => (
              <li
                key={event._id}
                className={cn(
                  "shrink-0 snap-center lg:w-auto",
                  toPick.length === 1 ? "w-full" : "w-[85%] sm:w-[60%]",
                )}
              >
                <NeedsPicksCard event={event} now={now} primary={index === 0} />
              </li>
            ))}
          </ul>
          {toPick.length > 1 ? (
            <p className="text-center text-xs text-muted lg:hidden">
              Swipe to see all {toPick.length}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-8">
          <EventGroup title="Live now" events={live} />
          <EventGroup title="Coming up" events={comingUp} />
        </div>
        <EventGroup title="Finished" events={finished} />
      </div>
    </Shell>
  );
}

function Shell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-5 pb-10 sm:px-6 sm:pt-8 lg:gap-10 lg:px-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}
