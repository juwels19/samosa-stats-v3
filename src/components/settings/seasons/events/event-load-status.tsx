import {
  AlertCircleIcon,
  CalendarCheckIcon,
  LoaderCircleIcon,
} from "lucide-react";

import { formatEventDate } from "@/components/events/utils";

type EventLoadStatusProps = {
  isLoading: boolean;
  error: Error | null;
  event: {
    name: string;
    startDate: string;
    endDate: string;
  } | null;
};

export default function EventLoadStatus({
  isLoading,
  error,
  event,
}: EventLoadStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border bg-secondary/60 p-4 text-sm">
        <LoaderCircleIcon className="mt-0.5 animate-spin" />
        <div>
          <p className="font-medium">Loading event details...</p>
          <p className="text-muted-foreground">
            Checking the FRC Events API for a matching event.
          </p>
        </div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircleIcon className="mt-0.5" />
        <div>
          <p className="font-medium">Event could not be loaded</p>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (event !== null) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border bg-primary/10 p-4 text-sm">
        <CalendarCheckIcon className="mt-0.5" />
        <div>
          <p className="font-medium">{event.name}</p>
          <p className="text-muted-foreground">
            {formatEventDate(event.startDate)} -{" "}
            {formatEventDate(event.endDate)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
      Event details will appear after a valid code is found.
    </div>
  );
}
