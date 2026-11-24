"use client";

import { AlertDialog, Button, Skeleton, toast } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import AddSeasonForm from "./add-season-form";
import DeductionAwardField from "./deduction-award-field";
import SeasonsEmptyState from "./seasons-empty";

export default function SeasonsList() {
  const currentUser = useCurrentUser();
  const seasons = useQuery(
    api.seasons.list,
    currentUser.user?.isAdmin ? {} : "skip",
  );
  const setActiveSeason = useMutation(api.seasons.setActive);
  const [pendingId, setPendingId] = useState<Id<"seasons"> | null>(null);
  const [confirmId, setConfirmId] = useState<Id<"seasons"> | null>(null);

  if (
    currentUser.isLoading ||
    (currentUser.user?.isAdmin && seasons === undefined)
  ) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!currentUser.user?.isAdmin || !seasons) {
    return (
      <p className="text-sm text-muted">
        You must be an admin to manage seasons.
      </p>
    );
  }

  const existingYears = seasons.map((s) => s.year);

  if (seasons.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <SeasonsEmptyState />
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-sm font-semibold">Add a season</h2>
          <AddSeasonForm existingYears={existingYears} />
        </section>
      </div>
    );
  }

  const active = seasons.find((s) => s.isActive) ?? null;
  const others = seasons.filter((s) => !s.isActive);
  const confirmSeason = seasons.find((s) => s._id === confirmId) ?? null;

  async function handleSetActive(seasonId: Id<"seasons">) {
    setPendingId(seasonId);
    try {
      await setActiveSeason({ seasonId });
      toast.success("Active season changed");
    } catch (error) {
      toast.danger("Active season not changed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {active ? (
        <section
          aria-labelledby="active-season-heading"
          className="flex flex-col gap-5 rounded-3xl bg-surface p-5 sm:p-6"
        >
          <div className="flex flex-col gap-1">
            <h1
              id="active-season-heading"
              className="text-xs font-semibold tracking-wide text-accent uppercase"
            >
              Active season
            </h1>
            <p className="font-heading text-4xl font-bold tracking-tight tabular-nums">
              {active.year}
            </p>
            <p className="text-muted">{active.gameName}</p>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {(
              [
                ["Events", active.eventCount],
                ["Categories", active.categoryCount],
                ["Picks made", active.pickCount],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-default p-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="font-heading text-xl font-semibold tabular-nums">
                  {value ?? "-"}
                </dd>
              </div>
            ))}
          </dl>
          <DeductionAwardField
            seasonId={active._id}
            awardType={active.deductionAwardType}
          />
        </section>
      ) : (
        <p className="rounded-2xl bg-warning-soft p-4 text-sm text-warning-soft-foreground">
          No season is active. Make one active below.
        </p>
      )}

      {others.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-semibold">Other seasons</h2>
          <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border">
            {others.map((season) => (
              <li
                key={season._id}
                className="flex min-h-16 items-center gap-3 px-4 py-3"
              >
                <span className="font-heading text-lg font-semibold tabular-nums">
                  {season.year}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted">
                  {season.gameName}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-10"
                  isDisabled={pendingId !== null}
                  isPending={pendingId === season._id}
                  onPress={() => setConfirmId(season._id)}
                >
                  Make active
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-sm font-semibold">Add a season</h2>
        <AddSeasonForm existingYears={existingYears} />
      </section>

      <AlertDialog.Backdrop
        isOpen={confirmSeason !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <AlertDialog.Container placement="auto">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="accent" />
              <AlertDialog.Heading>
                Make {confirmSeason?.year} the active season?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-muted">
                The dashboard, events and categories switch to{" "}
                {confirmSeason?.gameName}. You can switch back at any time.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                slot="close"
                onPress={() =>
                  confirmSeason && void handleSetActive(confirmSeason._id)
                }
              >
                Make active
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
