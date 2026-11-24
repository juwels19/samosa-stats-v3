import { CheckIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { getPicksRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  type DashboardEvent,
  formatDateRange,
  formatShortDate,
} from "./dashboard-event-utils";

export default function EventGroup({
  title,
  events,
}: {
  title: string;
  events: DashboardEvent[];
}) {
  if (events.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">
        {title}
      </h2>
      <ul className="overflow-hidden rounded-3xl bg-surface">
        {events.map((event) => (
          <li key={event._id} className="border-b border-separator last:border-0">
            <EventRow event={event} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EventRow({ event }: { event: DashboardEvent }) {
  const canOpen = event.status !== "UPCOMING";
  const rowClass = "flex min-h-16 items-center gap-3 px-4 py-3";
  const content = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-semibold">{event.displayName}</span>
        <span className="truncate text-sm text-muted">
          {formatDateRange(event.startDate, event.endDate)} · {event.name}
        </span>
      </div>
      <PickState event={event} />
      {canOpen ? (
        <ChevronRightIcon className="size-4 shrink-0 text-muted" aria-hidden />
      ) : null}
    </>
  );

  if (!canOpen) return <div className={rowClass}>{content}</div>;

  return (
    <Link
      href={getPicksRoute(event.eventCode)}
      className={cn(
        rowClass,
        "transition-colors duration-150 ease-out hover:bg-surface-hover active:bg-surface-hover",
      )}
    >
      {content}
    </Link>
  );
}

function PickState({ event }: { event: DashboardEvent }) {
  if (event.status === "UPCOMING") {
    return (
      <span className="shrink-0 text-sm text-muted">
        {event.submissionsOpenAt !== null
          ? `Opens ${formatShortDate(event.submissionsOpenAt)}`
          : "Not open"}
      </span>
    );
  }
  if (!event.hasSubmittedPicks) {
    return <span className="shrink-0 text-sm text-muted">No picks</span>;
  }
  return (
    <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-success">
      <CheckIcon className="size-3.5" aria-hidden />
      Picked
    </span>
  );
}
