"use client";

import { Alert, Button, Input, Modal, ProgressBar, SearchField, Spinner, toast } from "@heroui/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { CalendarPlusIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { formatDateRange } from "@/components/events/utils";
import { editEventPickSettingsSchema } from "@/components/events/constants";
import { getEventsForYear, getTeamsForYearAndCode, type FrcSeasonEvent } from "@/lib/fetch/frc-events";
import { cn } from "@/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import EventPickCountsFields from "./event-pick-counts-fields";
import { defaultDisplayName, eventTypeLabel, isOffSeason } from "./season-event-utils";

type Scope = "ONT" | "ALL";
const CONCURRENCY = 3;

export default function ImportSeasonEvents({
  activeSeason,
  categoryIds,
  existingEventCodes,
}: {
  activeSeason: Doc<"seasons"> | null;
  categoryIds: Id<"categories">[];
  existingEventCodes: string[];
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("ONT");
  const [teamPicks, setTeamPicks] = useState("8");
  const [categoryPicks, setCategoryPicks] = useState("5");
  // Selection and names are kept per event code; undefined means "use the default".
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<{ code: string; message: string }[]>([]);
  const [query, setQuery] = useState("");
  const createEvent = useMutation(api.events.create);

  const year = activeSeason?.year ?? null;
  const existing = new Set(existingEventCodes.map((code) => code.toUpperCase()));

  const eventsQuery = useQuery({
    queryKey: ["frc-season-events", year, scope],
    queryFn: () => getEventsForYear({ year: year!, districtCode: scope === "ONT" ? "ONT" : null }),
    enabled: open && year !== null,
  });
  const events = eventsQuery.data ?? [];

  const isAdded = (event: FrcSeasonEvent) => existing.has(event.eventCode.toUpperCase());
  // Ontario starts with every in-season event ticked; all of FRC starts empty.
  const isSelected = (event: FrcSeasonEvent) =>
    !isAdded(event) && (selected[event.eventCode] ?? (scope === "ONT" && !isOffSeason(event)));
  const nameFor = (event: FrcSeasonEvent) => names[event.eventCode] ?? defaultDisplayName(event.name);

  const chosen = events.filter(isSelected);
  const q = query.trim().toLowerCase();
  const visibleEvents = q
    ? events.filter(
        (event) =>
          event.name.toLowerCase().includes(q) ||
          event.eventCode.toLowerCase().includes(q) ||
          event.city.toLowerCase().includes(q),
      )
    : events;
  const addable = events.filter((event) => !isAdded(event));
  const countsValid = editEventPickSettingsSchema.safeParse({
    numberOfTeamPicks: teamPicks,
    numberOfCategoryPicks: categoryPicks,
  });
  const badNames = chosen.filter((event) => {
    const name = nameFor(event).trim();
    return name.length === 0 || name.length > 80;
  });
  const importing = progress !== null;
  const hasCategories = categoryIds.length > 0;
  // The first rule that blocks the import, shown next to the Add button.
  const blockedReason = !hasCategories
    ? "Add categories to this season before you import events."
    : !countsValid.success
      ? "Pick counts must be whole numbers above zero."
      : badNames.length > 0
        ? `${badNames.length} selected ${badNames.length === 1 ? "event needs" : "events need"} a display name of 1 to 80 characters.`
        : chosen.length === 0 && events.length > 0
          ? "Select at least one event."
          : null;
  const canImport = blockedReason === null && chosen.length > 0 && !importing;

  function handleOpenChange(next: boolean) {
    if (importing) return;
    setOpen(next);
    if (!next) {
      setSelected({});
      setNames({});
      setFailures([]);
      setQuery("");
    }
  }

  function setAll(value: boolean) {
    setSelected(Object.fromEntries(addable.map((event) => [event.eventCode, value])));
  }

  async function importOne(event: FrcSeasonEvent) {
    let teams: { name: string; number: number }[] = [];
    try {
      teams = await getTeamsForYearAndCode({ year: year!, eventCode: event.eventCode });
    } catch {
      // Team lists are often published late. Teams can be loaded later with Refresh teams.
    }
    await createEvent({
      name: event.name,
      displayName: nameFor(event).trim(),
      eventCode: event.eventCode,
      startDate: event.startDate,
      endDate: event.endDate,
      numberOfTeamPicks: BigInt(teamPicks),
      numberOfCategoryPicks: BigInt(categoryPicks),
      categories: categoryIds,
      teams,
    });
  }

  async function handleImport() {
    const queue = [...chosen];
    const failed: { code: string; message: string }[] = [];
    let done = 0;
    setFailures([]);
    setProgress({ done: 0, total: queue.length });

    async function worker() {
      while (queue.length > 0) {
        const event = queue.shift()!;
        try {
          await importOne(event);
        } catch (error) {
          failed.push({
            code: event.eventCode,
            message: error instanceof Error ? error.message : "Not saved.",
          });
        }
        done += 1;
        setProgress({ done, total: chosen.length });
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setProgress(null);

    const added = chosen.length - failed.length;
    if (added > 0) {
      toast.success("Events added", {
        description: `${added} ${added === 1 ? "event is" : "events are"} added to ${year}.`,
      });
    }
    if (failed.length > 0) {
      setFailures(failed);
      toast.danger(`${failed.length} ${failed.length === 1 ? "event was" : "events were"} not added`);
      // Keep only the failed events selected so they can be retried.
      setSelected(Object.fromEntries(addable.map((event) => [event.eventCode, failed.some((f) => f.code === event.eventCode)])));
    } else {
      handleOpenChange(false);
    }
  }

  return (
    <>
      <Button
        size="lg"
        variant="secondary"
        className="w-full sm:w-auto"
        isDisabled={activeSeason === null}
        onPress={() => setOpen(true)}
      >
        <CalendarPlusIcon className="size-4" />
        Import season
      </Button>

      <Modal.Backdrop isOpen={open} onOpenChange={handleOpenChange} isDismissable={!importing}>
        <Modal.Container placement="auto" scroll="inside">
          <Modal.Dialog className="sm:max-w-2xl">
            {importing ? null : <Modal.CloseTrigger />}
            <Modal.Header>
              <Modal.Heading>Import {year} events</Modal.Heading>
              <p className="text-sm text-muted">
                Loads events from FRC Events. Each event gets the pick counts below and all of
                the season&apos;s categories. You can change them per event later.
              </p>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-5">
              {!hasCategories ? (
                <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>This season has no categories</Alert.Title>
                    <Alert.Description>
                      Every event needs at least one category.{" "}
                      <Link
                        href="/settings/seasons/categories"
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        Add categories
                      </Link>
                      , then come back to import.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
              <div role="group" aria-label="Events to load" className="flex gap-1 self-start rounded-full bg-default p-1">
                {(
                  [
                    ["ONT", "Ontario district"],
                    ["ALL", "All FRC events"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={scope === value}
                    disabled={importing}
                    onClick={() => {
                      setScope(value);
                      setSelected({});
                      setQuery("");
                    }}
                    className={cn(
                      "min-h-10 rounded-full px-4 text-sm font-medium whitespace-nowrap text-muted transition-colors duration-150 ease-out",
                      scope === value && "bg-surface text-foreground shadow-sm",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <EventPickCountsFields
                idPrefix="import-season"
                numberOfTeamPicks={teamPicks}
                numberOfCategoryPicks={categoryPicks}
                onNumberOfTeamPicksChange={setTeamPicks}
                onNumberOfCategoryPicksChange={setCategoryPicks}
                showValidation
                teamPicksError={countsValid.success ? undefined : "Enter a positive whole number."}
                categoryPicksError={countsValid.success ? undefined : "Enter a positive whole number."}
              />

              <section aria-label="Events" className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm" aria-live="polite">
                    {eventsQuery.isFetching ? (
                      "Loading events from FRC Events"
                    ) : (
                      <>
                        <span className="font-semibold">{chosen.length}</span> of {addable.length} selected
                        {events.length > addable.length ? (
                          <span className="text-muted"> · {events.length - addable.length} already added</span>
                        ) : null}
                      </>
                    )}
                  </p>
                  {addable.length > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-10"
                      isDisabled={importing}
                      onPress={() => setAll(chosen.length !== addable.length)}
                    >
                      {chosen.length === addable.length ? "Clear all" : "Select all"}
                    </Button>
                  ) : null}
                </div>

                {events.length > 20 ? (
                  <SearchField aria-label="Search events" value={query} onChange={setQuery} fullWidth>
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Search by name, code or city" />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                ) : null}

                {eventsQuery.error instanceof Error ? (
                  <p role="alert" className="flex gap-2 rounded-2xl bg-danger-soft p-3 text-sm text-danger-soft-foreground">
                    <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {eventsQuery.error.message}
                  </p>
                ) : null}

                {eventsQuery.isFetching && events.length === 0 ? (
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                ) : events.length === 0 && !eventsQuery.isFetching && !eventsQuery.error ? (
                  <p className="py-8 text-center text-sm text-muted">
                    FRC Events has no events for {year} yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border">
                    {visibleEvents.map((event) => {
                      const added = isAdded(event);
                      const checked = isSelected(event);
                      const failure = failures.find((f) => f.code === event.eventCode);
                      const name = nameFor(event);
                      return (
                        <li
                          key={event.eventCode}
                          className={cn("flex gap-3 px-3 py-3", added && "opacity-60", checked && "bg-accent-soft/40")}
                        >
                          <label className="-my-1 -ml-2.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl has-disabled:cursor-default has-focus-visible:outline-2 has-focus-visible:outline-focus">
                            <input
                              type="checkbox"
                              aria-label={`Import ${event.name}`}
                              checked={checked}
                              disabled={added || importing}
                              onChange={(e) =>
                                setSelected((s) => ({ ...s, [event.eventCode]: e.target.checked }))
                              }
                              className="size-5 cursor-pointer accent-[var(--accent)] disabled:cursor-default"
                            />
                          </label>
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Input
                              aria-label={`Display name for ${event.name}`}
                              value={name}
                              maxLength={80}
                              disabled={added || !checked || importing}
                              onChange={(e) => setNames((n) => ({ ...n, [event.eventCode]: e.target.value }))}
                              className="w-full"
                            />
                            <p className="text-xs text-muted">
                              {event.name}
                            </p>
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                              <span className="font-medium text-foreground">{event.eventCode}</span>
                              <span>{formatDateRange(event.startDate, event.endDate)}</span>
                              {event.city ? <span>{event.city}</span> : null}
                              <span className="rounded-full bg-default px-2 py-0.5">{eventTypeLabel(event)}</span>
                              {added ? <span className="font-medium text-success">Already added</span> : null}
                            </p>
                            {failure ? (
                              <p className="text-xs font-medium text-danger">{failure.message}</p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </Modal.Body>

            <Modal.Footer className="flex flex-col gap-3">
              {progress ? (
                <ProgressBar
                  aria-label="Import progress"
                  value={progress.done}
                  maxValue={progress.total}
                  className="w-full"
                >
                  <div className="flex justify-between text-sm">
                    <span>Adding events</span>
                    <span className="tabular-nums">
                      {progress.done} of {progress.total}
                    </span>
                  </div>
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              ) : null}
              {blockedReason && !progress ? (
                <p role="status" className="w-full text-sm text-warning sm:text-right">
                  {blockedReason}
                </p>
              ) : null}
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                  isDisabled={importing}
                  onPress={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  isDisabled={!canImport}
                  isPending={importing}
                  onPress={() => void handleImport()}
                >
                  {chosen.length === 0
                    ? "Add events"
                    : `Add ${chosen.length} ${chosen.length === 1 ? "event" : "events"}`}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
