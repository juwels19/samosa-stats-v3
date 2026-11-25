"use client";

import { Alert, Chip, Disclosure, buttonVariants } from "@heroui/react";
import { format } from "date-fns";
import { SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { winnerConfigSchema } from "../../../convex/lib/scoring/winner_config";
import type { Id } from "../../../convex/_generated/dataModel";
import { getSelectOrder } from "@/components/settings/seasons/categories/scoring/get-select-order";
import PreviewResultsTable from "@/components/settings/seasons/categories/scoring/preview-results-table";
import ScriptResultDetails from "@/components/settings/seasons/categories/scoring/script-result-details";
import WinnerSourceChip from "@/components/settings/seasons/categories/scoring/winner-source-chip";
import ManualWinnersField from "./manual-winners-field";
import type { EventScoringCategory, EventTeam } from "./types";
import WinnerTeams from "./winner-teams";

/** One category at an event: its value, its winners and how they are set. */
export default function ScoringCategoryCard({
  category,
  teams,
  eventId,
  isLocked,
}: {
  category: EventScoringCategory;
  teams: EventTeam[];
  eventId: Id<"events">;
  /** True when the results are final, so winners can't change. */
  isLocked: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-semibold text-balance">{category.text}</h3>
          <p className="text-sm leading-6 whitespace-pre-wrap text-muted">
            {category.scoringDescription}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <WinnerSourceChip winnerSource={category.winnerSource} />
          <CategoryValue category={category} />
        </div>
      </div>

      <CategoryWinners
        category={category}
        teams={teams}
        eventId={eventId}
        isLocked={isLocked}
      />
      <ScriptPoints category={category} />
    </li>
  );
}

/** The last points from a global category's script. */
function ScriptPoints({ category }: { category: EventScoringCategory }) {
  if (!category.isGlobal || category.pointsSource !== "script") return null;
  const result = category.pointsResult;
  if (result === null) {
    return <p className="text-sm text-muted">Points not calculated yet. Select Calculate winners.</p>;
  }
  if (result.type === "error") {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Points not calculated {format(result.calculatedAt, "MMM d, h:mm a")}</Alert.Title>
          <Alert.Description className="whitespace-pre-wrap">{result.message}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  // A script that sets the winners too already shows its explanation.
  if (category.winnerSource?.type === "script") return null;
  return (
    <div className="flex flex-col gap-1 border-t border-border pt-3">
      <p className="text-sm">
        <span className="font-medium">
          {result.points === null ? "No points" : `${result.points} ${Math.abs(result.points) === 1 ? "pt" : "pts"}`}
        </span>{" "}
        <span className="text-muted">from the script. {result.explanation}</span>
      </p>
      <ScriptResultDetails teams={[]} apiCalls={result.apiCalls} />
    </div>
  );
}

function CategoryValue({ category }: { category: EventScoringCategory }) {
  if (category.isGlobal) {
    // Every submission gets a global category. Its value comes from its formula.
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
          category.hasValue
            ? "bg-accent-soft text-accent-soft-foreground"
            : "bg-warning-soft text-warning-soft-foreground",
        )}
        title={
          category.pointsSource === "manual"
            ? "Every submission gets this category. An admin sets each winning team's points."
            : category.pointsSource === "script"
            ? "Every submission gets this category. Its script gives the points."
            : category.valueFormula
              ? `Every submission gets this category. Points: ${category.valueFormula}`
              : "Every submission gets this category. Add a points formula on its Scoring page."
        }
      >
        {category.pointsSource === "manual"
          ? "Points per team"
          : category.hasValue
            ? `${category.value} ${Math.abs(category.value) === 1 ? "pt" : "pts"}`
            : "No value"}
        <span className="font-normal">· global</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        category.isTop
          ? "bg-warning-soft text-warning-soft-foreground"
          : "bg-default text-muted",
      )}
      title={`${category.picks} ${category.picks === 1 ? "pick" : "picks"} + 1 = ${category.baseValue}${
        category.isTop ? ". Top category, so the value is reduced." : ""
      }`}
    >
      {category.value} {category.value === 1 ? "pt" : "pts"}
      <span className="font-normal">
        · {category.picks} {category.picks === 1 ? "pick" : "picks"}
      </span>
      {category.isTop ? <span>· top</span> : null}
    </span>
  );
}

function CategoryWinners({
  category,
  teams,
  eventId,
  isLocked,
}: {
  category: EventScoringCategory;
  teams: EventTeam[];
  eventId: Id<"events">;
  isLocked: boolean;
}) {
  const { winnerSource, result } = category;

  if (winnerSource === undefined) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Set up scoring to find winners.</p>
        <Link
          href={`/settings/seasons/categories/${category._id}`}
          className={buttonVariants({ size: "sm", variant: "secondary" })}
        >
          <SlidersHorizontalIcon className="size-4" aria-hidden />
          Scoring
        </Link>
      </div>
    );
  }

  if (winnerSource.type === "leastUnique") {
    const leastUnique = category.leastUnique ?? [];
    if (leastUnique.length === 0) {
      return <p className="text-sm text-muted">No submissions yet.</p>;
    }
    return (
      <div className="flex flex-col gap-2">
        <ul className="flex flex-wrap gap-2" aria-label="Least unique submissions">
          {leastUnique.map((submission) => (
            <li key={submission.name}>
              <Chip variant="soft" color="warning">
                <span className="max-w-64 truncate font-semibold">{submission.name}</span>
                <span className="tabular-nums">uniqueness {submission.uniqueness}</span>
              </Chip>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          From the current picks. Each submission here gets this category&apos;s points one time.
        </p>
      </div>
    );
  }

  if (winnerSource.type === "manual") {
    const saved = result?.type === "manual" ? result.winners : [];
    const savedPoints = result?.type === "manual" ? (result.teamPoints ?? []) : [];
    const usesTeamPoints = category.isGlobal && category.pointsSource === "manual";
    if (isLocked) {
      return <WinnerTeams winners={saved} teams={teams} points={usesTeamPoints ? savedPoints : undefined} />;
    }
    return (
      <div className="flex flex-col gap-2">
        <ManualWinnersField
          // Reset local edits when the saved winners change.
          key={`${saved.join(",")}|${savedPoints.map((row) => `${row.team}:${row.points}`).join(",")}`}
          eventId={eventId}
          categoryId={category._id}
          teams={teams}
          savedWinners={saved}
          usesTeamPoints={usesTeamPoints}
          savedPoints={savedPoints}
        />
        {result?.type === "manual" ? (
          <p className="text-xs text-muted">
            Saved {format(result.updatedAt, "MMM d, h:mm a")}
          </p>
        ) : null}
      </div>
    );
  }

  if (result === null) {
    return (
      <p className="text-sm text-muted">
        Not calculated yet. Select Calculate winners.
      </p>
    );
  }

  if (result.type === "error") {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            Not calculated {format(result.calculatedAt, "MMM d, h:mm a")}
          </Alert.Title>
          <Alert.Description className="whitespace-pre-wrap">
            {result.message}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (result.type === "script") {
    return (
      <div className="flex flex-col gap-2">
        <WinnerTeams winners={result.winners} teams={teams} />
        <p className="text-sm">{result.explanation}</p>
        <ScriptResultDetails teams={result.teams} apiCalls={result.apiCalls} />
      </div>
    );
  }

  if (result.type !== "config" || winnerSource.type !== "config") return null;

  const parsed = winnerConfigSchema.safeParse(winnerSource.config);
  const order = parsed.success ? getSelectOrder(parsed.data) : "desc";

  return (
    <div className="flex flex-col gap-2">
      <WinnerTeams winners={result.winners} teams={teams} />
      <Disclosure>
        <Disclosure.Heading>
          <Disclosure.Trigger className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted">
            All team results
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="pt-2">
            <PreviewResultsTable teams={result.teams} order={order} />
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
