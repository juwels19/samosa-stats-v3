import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import { EVENT_STATUS_LABELS } from "./constants";
import { formatEventDate } from "./format-event-date";

export default function EventCard({ event }: { event: Doc<"events"> }) {
  const getStatusBadgeVariant = (status: Doc<"events">["status"]) => {
    switch (status) {
      case "UPCOMING":
        return "secondary";
      case "SUBMISSIONS_OPEN":
      case "COMPLETE":
        return "success";
      case "SUBMISSIONS_CLOSED":
        return "destructive";
      case "ONGOING":
        return "default";
    }
  };
  return (
    <Card size="sm" role="listitem">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{event.displayName}</CardTitle>
          <Badge variant={getStatusBadgeVariant(event.status)}>
            {EVENT_STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <CardDescription>
          {event.name}
          <br />
          {formatEventDate(event.startDate)} - {formatEventDate(event.endDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-secondary/60 p-3">
            <dt className="text-muted-foreground">Team picks</dt>
            <dd className="font-medium">
              {event.numberOfTeamPicks.toString()}
            </dd>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-3">
            <dt className="text-muted-foreground">Category picks</dt>
            <dd className="font-medium">
              {event.numberOfCategoryPicks.toString()}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
