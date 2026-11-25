"use client";

import { Chip, Disclosure } from "@heroui/react";
import type { FunctionReturnType } from "convex/server";

import { cn } from "@/lib/utils";
import type { api } from "../../../convex/_generated/api";
import type { EventScoringCategory } from "./types";

type Score = FunctionReturnType<typeof api.results.getEventResults>["scores"][number];
type LineItem = Score["lineItems"][number];

/** Each submission's score, highest first, with its picks and line items. */
export default function EventScoresTable({
  scores,
  categories,
  teamNames,
}: {
  scores: Score[];
  categories: readonly EventScoringCategory[];
  teamNames: ReadonlyMap<number, string>;
}) {
  if (scores.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        No submissions for this event.
      </p>
    );
  }

  const categoryNames = new Map(categories.map((category) => [category._id, category.text]));
  const globalIds = new Set(
    categories.filter((category) => category.isGlobal).map((category) => category._id),
  );
  const team = (number: number) =>
    teamNames.has(number) ? `${number} ${teamNames.get(number)}` : String(number);
  const describe = (item: LineItem) => {
    switch (item.type) {
      case "category":
        return `${categoryNames.get(item.category) ?? "Removed category"}${
          globalIds.has(item.category) ? " (global)" : ""
        } · ${team(item.team)}`;
      case "award":
        return `Deduction award · ${team(item.team)}`;
      case "leastUnique":
        return item.category
          ? `${categoryNames.get(item.category) ?? "Removed category"} (global) · least unique submission`
          : "Least unique submission";
    }
  };

  return (
    <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface">
      {scores.map((score) => (
        <li key={score.pick}>
          <Disclosure>
            <Disclosure.Heading>
              <Disclosure.Trigger className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{score.name}</span>
                    {score.isMock ? (
                      <Chip size="sm" variant="soft">
                        Mock
                      </Chip>
                    ) : null}
                  </span>
                  <span className="truncate text-xs text-muted tabular-nums">
                    Teams {score.teams.join(", ")} · {score.categories.length}{" "}
                    {score.categories.length === 1 ? "category" : "categories"} · uniqueness{" "}
                    {score.uniqueness}
                  </span>
                </div>
                <Points amount={score.total} className="text-base font-semibold" />
                <Disclosure.Indicator />
              </Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="flex flex-col gap-4 px-4 pb-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <PickList
                    title="Teams"
                    items={score.teams.map((number) => ({ key: String(number), label: team(number) }))}
                  />
                  <PickList
                    title="Categories"
                    items={score.categories.map((id) => ({
                      key: id,
                      label: categoryNames.get(id) ?? "Removed category",
                    }))}
                  />
                </div>
                <section className="flex flex-col gap-1.5">
                  <h3 className="text-xs font-medium text-muted">Points</h3>
                  {score.lineItems.length === 0 ? (
                    <p className="text-sm text-muted">No points: none of the picks won.</p>
                  ) : (
                    <ul className="flex flex-col gap-1 text-sm">
                      {score.lineItems.map((item, index) => (
                        <li key={index} className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-muted">{describe(item)}</span>
                          <Points amount={item.amount} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
        </li>
      ))}
    </ul>
  );
}

function PickList({
  title,
  items,
}: {
  title: string;
  items: { key: string; label: string }[];
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted">
        {title} <span className="tabular-nums">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">None</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((item) => (
            <li key={item.key} className="truncate">
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Points({ amount, className }: { amount: number; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 tabular-nums",
        amount > 0 && "text-success",
        amount < 0 && "text-danger",
        className,
      )}
    >
      {amount > 0 ? `+${amount}` : amount}
    </span>
  );
}
