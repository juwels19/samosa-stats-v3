"use client";

import { Skeleton } from "@heroui/react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDateRange } from "@/components/events/utils";
import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import CreateEvent from "./create-event";
import ImportSeasonEvents from "./import-season-events";
import EditEvent from "./edit-event";
import EventRowMenu from "./event-row-menu";
import EventStatusDot from "./event-status-dot";
import EventsEmptyState from "./events-empty";
import { useEventActions } from "./use-event-actions";

export default function EventsList() {
  const currentUser = useCurrentUser();
  const eventData = useQuery(
    api.events.list,
    currentUser.user?.isAdmin ? {} : "skip",
  );
  const actions = useEventActions(eventData?.activeSeason?.year ?? null);
  const [editingId, setEditingId] = useState<Id<"events"> | null>(null);

  const events = eventData?.events ?? [];
  const players = eventData?.approvedPlayerCount;
  const editingEvent = events.find((event) => event._id === editingId) ?? null;

  const header = (
    <SettingsPageHeader
      title="Events"
      description={
        eventData?.activeSeason
          ? `${events.length} events in the ${eventData.activeSeason.year} season`
          : "Events for the active season"
      }
      action={
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <ImportSeasonEvents
            activeSeason={eventData?.activeSeason ?? null}
            categoryIds={[
              ...(eventData?.globalCategories ?? []),
              ...(eventData?.seasonCategories ?? []),
            ].map((category) => category._id)}
            existingEventCodes={events.map((event) => event.eventCode)}
          />
          <CreateEvent
            activeSeason={eventData?.activeSeason ?? null}
            globalCategories={eventData?.globalCategories ?? []}
            seasonCategories={eventData?.seasonCategories ?? []}
          />
        </div>
      }
    />
  );

  if (currentUser.isLoading || (currentUser.user?.isAdmin && eventData === undefined)) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!currentUser.user?.isAdmin || eventData === undefined) {
    return <p className="text-sm text-muted">Admin access is required to manage events.</p>;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EventsEmptyState hasActiveSeason={eventData.activeSeason !== null} />
      </div>
    );
  }

  const menuFor = (event: (typeof events)[number]) => (
    <EventRowMenu
      event={event}
      isPending={actions.isPending(event._id)}
      onEdit={() => setEditingId(event._id)}
      onRefreshTeams={() => void actions.refreshTeams(event)}
      onRandomPick={() => void actions.randomPick(event)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {header}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary text-left text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Event</th>
              <th scope="col" className="px-4 py-3 font-medium">Dates</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Picks</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Teams</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Players in</th>
              <th scope="col" className="w-14 px-2 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator bg-surface">
            {events.map((event) => (
              <tr
                key={event._id}
                className="transition-colors duration-150 ease-out hover:bg-surface-hover"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{event.displayName}</div>
                  <div className="max-w-72 truncate text-xs text-muted">
                    {event.eventCode} · {event.name}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {formatDateRange(event.startDate, event.endDate)}
                </td>
                <td className="px-4 py-3">
                  <EventStatusDot status={event.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {event.numberOfTeamPicks.toString()} + {event.numberOfCategoryPicks.toString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <TeamCount count={event.teamCount} />
                </td>
                <td className="px-4 py-3 text-right text-muted tabular-nums">
                  <PlayersIn picks={event.pickCount} players={players} />
                </td>
                <td className="px-2 py-2 text-right">{menuFor(event)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone and tablet rows */}
      <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface lg:hidden">
        {events.map((event) => (
          <li key={event._id} className="flex items-center gap-3 py-3 pr-2 pl-4">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{event.displayName}</span>
                <EventStatusDot status={event.status} className="text-xs text-muted" />
              </div>
              <span className="truncate text-xs text-muted tabular-nums">
                {formatDateRange(event.startDate, event.endDate)} ·{" "}
                {event.numberOfTeamPicks.toString()}+{event.numberOfCategoryPicks.toString()} picks
                {event.pickCount !== undefined ? (
                  <>
                    {" · "}
                    <PlayersIn picks={event.pickCount} players={players} /> in
                  </>
                ) : null}
              </span>
              {event.teamCount === 0 ? (
                <span className="text-xs font-medium text-warning">Teams not loaded</span>
              ) : null}
            </div>
            {menuFor(event)}
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted">Picks shows teams + categories each player picks.</p>

      {editingEvent ? (
        <EditEvent
          event={editingEvent}
          globalCategories={eventData.globalCategories}
          seasonCategories={eventData.seasonCategories}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function TeamCount({ count }: { count: number | undefined }) {
  if (count === undefined) return <span className="text-muted">-</span>;
  if (count === 0) return <span className="font-medium text-warning">Not loaded</span>;
  return <span className="tabular-nums">{count}</span>;
}

function PlayersIn({ picks, players }: { picks: number | undefined; players: number | undefined }) {
  if (picks === undefined) return <>-</>;
  return <>{players === undefined ? picks : `${picks}/${players}`}</>;
}
