"use client";

import { Skeleton } from "@heroui/react";
import { useQuery } from "convex/react";
import { format } from "date-fns";

import { useCurrentUser } from "@/hooks/use-current-user";
import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { api } from "../../../convex/_generated/api";
import EventStatusDot from "@/components/settings/seasons/events/event-status-dot";
import CalculateWinnersButton from "./calculate-winners-button";
import ScoringCategoryCard from "./scoring-category-card";
import {
  getLastCalculatedAt,
  groupScoringCategories,
} from "./group-scoring-categories";
import type { EventScoringCategory, EventScoringData } from "./types";

/** Category values and winners for one event. */
export default function EventScoring({ eventId }: { eventId: string }) {
  const currentUser = useCurrentUser();
  const data = useQuery(
    api.scoring.getEventScoring,
    currentUser.user?.isAdmin ? { eventId } : "skip",
  );

  if (
    currentUser.isLoading ||
    (currentUser.user?.isAdmin && data === undefined)
  ) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!currentUser.user?.isAdmin) {
    return (
      <p className="text-sm text-muted">
        You must be an admin to manage event scoring.
      </p>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted">Event not found.</p>;
  }

  return <EventScoringContent data={data} />;
}

function EventScoringContent({ data }: { data: EventScoringData }) {
  const { event, teams, categories, submissionCount } = data;
  const groups = groupScoringCategories(categories);
  const lastCalculatedAt = getLastCalculatedAt(categories);

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title={event.displayName}
        description={`${event.eventCode} · ${submissionCount} ${
          submissionCount === 1 ? "submission" : "submissions"
        } · ${teams.length} teams`}
        action={
          <CalculateWinnersButton
            eventId={event._id}
            isDisabled={groups.automatic.length === 0}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <EventStatusDot status={event.status} />
        <span>
          {lastCalculatedAt === null
            ? "Automatic winners not calculated yet"
            : `Calculated ${format(lastCalculatedAt, "MMM d, h:mm a")}`}
        </span>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-2xl bg-warning-soft p-4 text-sm text-warning-soft-foreground">
          This event has no teams. Refresh its teams on the Events page before
          you calculate or select winners.
        </p>
      ) : null}

      <CategoryGroup
        title="Automatic"
        description="Winners come from TBA and Statbotics data. Calculate again to get the latest results."
        categories={groups.automatic}
        teams={teams}
        eventId={event._id}
      />
      <CategoryGroup
        title="Manual"
        description="Select the teams that won each category."
        categories={groups.manual}
        teams={teams}
        eventId={event._id}
      />
      <CategoryGroup
        title="Not set up"
        description="These categories have no scoring setup and can't have winners yet."
        categories={groups.notSetUp}
        teams={teams}
        eventId={event._id}
      />
    </div>
  );
}

function CategoryGroup({
  title,
  description,
  categories,
  teams,
  eventId,
}: {
  title: string;
  description: string;
  categories: EventScoringCategory[];
  teams: EventScoringData["teams"];
  eventId: EventScoringData["event"]["_id"];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">
          {title}{" "}
          <span className="font-normal text-muted tabular-nums">
            {categories.length}
          </span>
        </h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {categories.map((category) => (
          <ScoringCategoryCard
            key={category._id}
            category={category}
            teams={teams}
            eventId={eventId}
          />
        ))}
      </ul>
    </section>
  );
}
