"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import EventCard from "@/components/events/event-card";
import CreateEvent from "./create-event";
import EventsEmptyState from "./events-empty";

export default function EventsList() {
  const currentUser = useCurrentUser();
  const eventData = useQuery(
    api.events.list,
    currentUser.user?.isAdmin ? {} : "skip",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>
          Manage events for the active season and configure pick counts.
        </CardDescription>
        <CardAction>
          <CreateEvent
            activeSeason={eventData?.activeSeason ?? null}
            globalCategories={eventData?.globalCategories ?? []}
            seasonCategories={eventData?.seasonCategories ?? []}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {currentUser.isLoading || eventData === undefined ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
          </div>
        ) : !currentUser.user?.isAdmin ? (
          <div className="text-sm text-muted-foreground">
            Admin access is required to manage events.
          </div>
        ) : eventData.events.length === 0 ? (
          <EventsEmptyState hasActiveSeason={eventData.activeSeason !== null} />
        ) : (
          <div role="list" className="grid gap-4 lg:grid-cols-2">
            {eventData.events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
