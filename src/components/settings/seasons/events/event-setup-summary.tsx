import { Chip } from "@heroui/react";
import { CheckCircle2Icon } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";

export default function EventSetupSummary({
  title,
  subtitle,
  dates,
  numberOfTeamPicks,
  numberOfCategoryPicks,
  selectedCategories,
}: {
  title: string;
  subtitle: string;
  dates: string;
  numberOfTeamPicks: string;
  numberOfCategoryPicks: string;
  selectedCategories: Doc<"categories">[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-2xl bg-success-soft p-4">
        <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-success" />
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-default p-4">
          <dt className="text-sm text-muted">Dates</dt>
          <dd className="font-medium">{dates}</dd>
        </div>
        <div className="rounded-2xl bg-default p-4">
          <dt className="text-sm text-muted">Pick counts</dt>
          <dd className="font-medium tabular-nums">
            {numberOfTeamPicks || "0"} teams, {numberOfCategoryPicks || "0"}{" "}
            categories
          </dd>
        </div>
      </dl>
      <section className="rounded-2xl bg-default p-4">
        <h3 className="font-heading font-medium">Selected categories</h3>
        <p className="mt-1 text-sm text-muted">
          {selectedCategories.length} categories are available for this event.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <li key={category._id}>
              <Chip size="md" variant="tertiary">
                {category.text}
              </Chip>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
