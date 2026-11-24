import { cn } from "@/lib/utils";
import type { Doc } from "../../../../../convex/_generated/dataModel";

type Status = Doc<"events">["status"];

const LABELS: Record<Status, string> = {
  UPCOMING: "Upcoming",
  SUBMISSIONS_OPEN: "Open",
  SUBMISSIONS_CLOSED: "Gates closed",
  ONGOING: "Live",
  COMPLETE: "Done",
};

const DOTS: Record<Status, string> = {
  UPCOMING: "bg-border-tertiary",
  SUBMISSIONS_OPEN: "bg-accent",
  SUBMISSIONS_CLOSED: "bg-danger",
  ONGOING: "bg-warning",
  COMPLETE: "bg-success",
};

export default function EventStatusDot({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span aria-hidden className={cn("size-2 rounded-full", DOTS[status])} />
      {LABELS[status]}
    </span>
  );
}
