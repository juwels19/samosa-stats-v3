"use client";

import EventCard from "@/components/events/event-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConvexAuth, useQuery } from "convex/react";
import { CalendarDaysIcon } from "lucide-react";

import { api } from "../../../convex/_generated/api";

export default function DashboardEvents() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const eventData = useQuery(
    api.events.listForDashboard,
    isAuthenticated ? {} : "skip",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>
          {eventData?.activeSeason
            ? `${eventData.activeSeason.year} ${eventData.activeSeason.gameName}`
            : "Events for the active season."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || eventData === undefined ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
          </div>
        ) : eventData.activeSeason === null ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon />
              </EmptyMedia>
              <EmptyTitle>No active season</EmptyTitle>
              <EmptyDescription>
                Events will appear here once a season is active.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : eventData.events.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon />
              </EmptyMedia>
              <EmptyTitle>No events yet</EmptyTitle>
              <EmptyDescription>
                Events will appear here after they are added to the active
                season.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
