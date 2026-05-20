import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2Icon } from "lucide-react";
import type { ReactNode } from "react";

import { EVENT_STATUS_BADGE_VARIANTS, EVENT_STATUS_LABELS } from "./constants";
import { formatEventDate } from "@/components/events/utils";
import type { EventCardEvent } from "./types";

export default function EventCard({
  event,
  footer,
}: {
  event: EventCardEvent;
  footer?: ReactNode;
}) {
  return (
    <Card size="sm" role="listitem">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{event.displayName}</CardTitle>
          <div className="flex flex-wrap justify-end gap-2">
            {event.hasSubmittedPicks ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2Icon className="size-3" aria-hidden="true" />
                Picks submitted
              </Badge>
            ) : null}
            <Badge variant={EVENT_STATUS_BADGE_VARIANTS[event.status]}>
              {EVENT_STATUS_LABELS[event.status]}
            </Badge>
          </div>
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
      {footer ? (
        <CardFooter className="flex w-full justify-end">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
