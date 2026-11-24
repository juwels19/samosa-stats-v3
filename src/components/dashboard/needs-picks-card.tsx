import { buttonVariants } from "@heroui/react";
import Link from "next/link";
import { getPicksRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  type DashboardEvent,
  formatCloseTime,
  formatCountdown,
  formatDateRange,
} from "./dashboard-event-utils";

export default function NeedsPicksCard({
  event,
  now,
  primary,
}: {
  event: DashboardEvent;
  now: number;
  primary: boolean;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col gap-4 rounded-3xl p-5 lg:p-6",
        primary ? "bg-accent text-accent-foreground" : "bg-surface ring-1 ring-border",
      )}
    >
      {event.gatesCloseAt !== null ? (
        <div className="flex flex-col gap-1">
          <span className={cn("text-xs font-medium", primary ? "opacity-85" : "text-muted")}>
            Closes {formatCloseTime(event.gatesCloseAt)} ET
          </span>
          <span
            className="font-heading text-3xl font-bold tracking-tight tabular-nums"
            aria-label={`Picks close in ${formatCountdown(event.gatesCloseAt - now)}`}
          >
            {formatCountdown(event.gatesCloseAt - now)}
          </span>
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold text-balance">
          {event.displayName}
        </h2>
        <p className={cn("text-sm", primary ? "opacity-85" : "text-muted")}>
          {event.name}
        </p>
        <p className={cn("text-sm", primary ? "opacity-85" : "text-muted")}>
          {formatDateRange(event.startDate, event.endDate)} ·{" "}
          {event.numberOfTeamPicks.toString()} teams,{" "}
          {event.numberOfCategoryPicks.toString()} categories
        </p>
      </div>
      <Link
        href={getPicksRoute(event.eventCode)}
        className={cn(
          buttonVariants({ size: "lg", fullWidth: true }),
          primary && "bg-accent-foreground text-accent hover:bg-accent-foreground/90",
        )}
      >
        Make picks
      </Link>
    </article>
  );
}
