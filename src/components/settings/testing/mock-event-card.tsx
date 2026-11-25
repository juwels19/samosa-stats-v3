"use client";

import { AlertDialog, Button, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { PauseIcon, PlayIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import EventStatusDot from "@/components/settings/seasons/events/event-status-dot";
import { getEventScoresRoute, getPicksRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { errorMessage, MOCK_STEPS, type MockStep, type OverviewEvent } from "./types";

const STATUS_ORDER = ["UPCOMING", "SUBMISSIONS_OPEN", "SUBMISSIONS_CLOSED", "ONGOING", "COMPLETE"];

/** A step is done when the event has reached its status. The reminder has no status. */
function isStepDone(step: MockStep, status: OverviewEvent["status"]) {
  if (step === "PICK_REMINDER") return false;
  return STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(step);
}

const STATE_LABELS: Record<string, string> = {
  pending: "Scheduled",
  inProgress: "Running",
  success: "Ran",
  failed: "Failed",
  canceled: "Paused",
};

/** One mock event: its steps, with a button to run each one now. */
export default function MockEventCard({
  event,
}: {
  event: OverviewEvent;
}) {
  const runStep = useMutation(api.mocks.runMockStep);
  const restart = useMutation(api.mocks.restartMockEvent);
  const pause = useMutation(api.mocks.pauseMockEvent);
  const remove = useMutation(api.mocks.deleteMockEvent);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const interval = event.mock?.intervalMinutes ?? 2;
  const hasPendingSteps = event.steps.some((step) => step.state === "pending");

  const act = async (key: string, action: () => Promise<unknown>, success: string) => {
    setPending(key);
    try {
      await action();
      toast.success(success, { description: event.displayName });
    } catch (error) {
      toast.danger("Action failed", { description: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-medium">{event.displayName}</h3>
            <EventStatusDot status={event.status} className="text-sm text-muted" />
          </div>
          <p className="text-xs text-muted tabular-nums">
            {event.eventCode} · copy of {event.mock?.sourceEventCode} · {event.teamCount} teams ·{" "}
            {event.pickCount} picks · {interval} min per step
          </p>
          <p className="flex gap-3 text-xs">
            <Link className="text-accent hover:underline" href={getPicksRoute(event.eventCode)}>
              Picks page
            </Link>
            <Link className="text-accent hover:underline" href={getEventScoresRoute(event._id)}>
              Scores page
            </Link>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={!hasPendingSteps}
            isPending={pending === "pause"}
            onPress={() => void act("pause", () => pause({ eventId: event._id }), "Scheduled steps paused")}
          >
            <PauseIcon className="size-4" aria-hidden />
            Pause
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            isPending={pending === "restart"}
            onPress={() =>
              void act(
                "restart",
                () => restart({ eventId: event._id, intervalMinutes: interval }),
                "Mock event restarted",
              )
            }
          >
            <RotateCcwIcon className="size-4" aria-hidden />
            Restart
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => setConfirmDelete(true)}
          >
            <Trash2Icon className="size-4" aria-hidden />
            Delete
          </Button>
        </div>
      </header>

      <ol className="divide-y divide-separator overflow-hidden rounded-xl border border-border">
        {MOCK_STEPS.map(({ step, label }, index) => {
          const job = event.steps[index];
          const done = isStepDone(step, event.status);
          return (
            <li key={step} className="flex min-h-14 items-center gap-3 px-3 py-2">
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  done || job?.state === "success" ? "bg-success" : "bg-border-tertiary",
                  job?.state === "failed" && "bg-danger",
                )}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted tabular-nums">
                  {job
                    ? `${STATE_LABELS[job.state] ?? job.state} · ${format(job.scheduledTime, "h:mm:ss a")}`
                    : "Not scheduled"}
                  {done && step !== "PICK_REMINDER" ? " · status reached" : ""}
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                isDisabled={done}
                isPending={pending === step}
                onPress={() =>
                  void act(step, () => runStep({ eventId: event._id, step }), `${label}: started`)
                }
              >
                <PlayIcon className="size-4" aria-hidden />
                Run now
              </Button>
            </li>
          );
        })}
      </ol>

      <AlertDialog.Backdrop isOpen={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialog.Container placement="auto">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Delete {event.displayName}?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-muted">
                This deletes the mock event with its picks and winners, and cancels its scheduled
                steps. The Discord log stays.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                slot="close"
                variant="danger"
                onPress={() =>
                  void act("delete", () => remove({ eventId: event._id }), "Mock event deleted")
                }
              >
                Delete
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </article>
  );
}
