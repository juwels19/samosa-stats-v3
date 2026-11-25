"use client";

import { Description, FieldError, Input, Label, TextField } from "@heroui/react";

import {
  GLOBAL_VALUE_FUNCTIONS,
  GLOBAL_VALUE_VARIABLES,
} from "../../../../../../convex/lib/scoring/global_value";

const TERMS = [
  ...Object.entries(GLOBAL_VALUE_VARIABLES).map(([name, description]) => ({ name, description })),
  ...Object.entries(GLOBAL_VALUE_FUNCTIONS).map(([name, description]) => ({
    name: `${name}(n)`,
    description: capitalize(description.replace(/^\w+\(n\): /, "")),
  })),
];

/**
 * The points a global category gives for each winning team: a formula of
 * event and submission values, calculated at each event. Saved with the rest
 * of the scoring. Not the same as a config's Value, which ranks teams.
 */
export default function ValueFormulaSection({
  value,
  error,
  onChange,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">Points per winning team</h2>
        <p className="text-sm text-muted">
          Every submission gets this global category. Each of its winning teams in a submission gives these
          points, calculated at each event from the picks and rounded down.
        </p>
      </div>
      <TextField fullWidth value={value} onChange={onChange} isInvalid={error !== null}>
        <Label>Points formula</Label>
        <Input className="font-mono" placeholder="maxCategoryValue - minCategoryValue" />
        {error !== null ? (
          <FieldError>{error}</FieldError>
        ) : (
          <Description>
            For example teamPicks(6) or ceil(categoryValue(2) / 2). Use + - * /, // (integer division), %
            (mod), round() ceil() floor() and parentheses. n starts at 1, the highest.
          </Description>
        )}
      </TextField>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {TERMS.map((term) => (
          <div key={term.name} className="flex flex-col">
            <dt className="font-mono text-foreground">{term.name}</dt>
            <dd className="text-muted">{term.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
