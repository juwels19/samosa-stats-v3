"use client";

import { Alert, AlertDialog, Button, Chip, Skeleton, toast } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { LockIcon, LockOpenIcon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import EventScoresTable from "./event-scores-table";
import type { EventScoringCategory, EventTeam } from "./types";

/**
 * The results status of an event and each submission's score. Draft scores
 * change with the winners. Finalize saves them.
 */
export default function EventResults({
  eventId,
  teams,
  categories,
}: {
  eventId: Id<"events">;
  teams: readonly EventTeam[];
  categories: readonly EventScoringCategory[];
}) {
  const results = useQuery(api.results.getEventResults, { eventId });
  const finalize = useMutation(api.results.finalize);
  const reopen = useMutation(api.results.reopen);
  const [confirm, setConfirm] = useState<"finalize" | "reopen" | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (results === undefined) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }

  const isFinal = results.status === "final";
  const teamNames = new Map(teams.map((team) => [team.number, team.name]));

  const run = async () => {
    const action = confirm;
    setConfirm(null);
    if (action === null) return;
    setIsPending(true);
    try {
      await (action === "finalize" ? finalize({ eventId }) : reopen({ eventId }));
      toast.success(action === "finalize" ? "Results are final" : "Results reopened");
    } catch (error) {
      toast.danger(action === "finalize" ? "Results not final" : "Results not reopened", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-semibold">
            Results
            <Chip size="sm" variant="soft" color={isFinal ? "success" : "default"}>
              {isFinal ? "Final" : "Draft"}
            </Chip>
          </h2>
          <p className="text-sm text-muted">
            {isFinal && results.finalizedAt !== null
              ? `Final since ${format(results.finalizedAt, "MMM d, h:mm a")}. Winners and scores are locked.`
              : "Scores change as winners change. Finalize to save them."}
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          variant={isFinal ? "tertiary" : "primary"}
          isDisabled={!isFinal && results.blockers.length > 0}
          isPending={isPending}
          onPress={() => setConfirm(isFinal ? "reopen" : "finalize")}
        >
          {isFinal ? (
            <LockOpenIcon className="size-4" aria-hidden />
          ) : (
            <LockIcon className="size-4" aria-hidden />
          )}
          {isFinal ? "Reopen" : "Finalize"}
        </Button>
      </div>

      {results.blockers.length > 0 ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Before the results can be final</Alert.Title>
            <Alert.Description>
              <ul className="list-disc pl-4">
                {results.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat label="Top category value" value={String(results.topCatValue)} />
        <Stat label="Top team value" value={String(results.topTeamValue)} />
        <Stat
          label="Deduction award"
          value={results.deductionAward?.name ?? "Not set"}
          className="col-span-2"
        />
        <Stat
          label="Award winners"
          value={
            results.awardsFetchedAt === null
              ? "Not loaded"
              : results.awardWinners.length === 0
                ? "None"
                : results.awardWinners
                    .map((team) => (teamNames.has(team) ? `${team} ${teamNames.get(team)}` : String(team)))
                    .join(", ")
          }
          detail={
            results.awardsFetchedAt === null
              ? undefined
              : `From TBA ${format(results.awardsFetchedAt, "MMM d, h:mm a")}`
          }
          className="col-span-2 sm:col-span-4"
        />
      </dl>

      <EventScoresTable scores={results.scores} categories={categories} teamNames={teamNames} />

      <AlertDialog.Backdrop isOpen={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialog.Container placement="auto">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status={confirm === "reopen" ? "warning" : "accent"} />
              <AlertDialog.Heading>
                {confirm === "reopen" ? "Reopen the results?" : "Make the results final?"}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-muted">
                {confirm === "reopen"
                  ? "The saved scores are deleted and winners can change again. Finalize again to save new scores."
                  : `This saves the scores of all ${results.scores.length} submissions and locks the winners. A later change to the deduction award does not change them.`}
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button onPress={() => void run()}>
                {confirm === "reopen" ? "Reopen" : "Finalize"}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </section>
  );
}

function Stat({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-xl bg-default p-3 ${className ?? ""}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
      {detail ? <dd className="text-xs text-muted">{detail}</dd> : null}
    </div>
  );
}
