"use client";

import { Description, Disclosure, FieldError, Input, Label, TextField } from "@heroui/react";

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
 * The points formula of a global category: event and submission values,
 * calculated at each event. Not the same as a data rule's ranking value.
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
    <div className="flex flex-col gap-3">
      <TextField fullWidth value={value} onChange={onChange} isInvalid={error !== null}>
        <Label>Points formula</Label>
        <Input className="font-mono" placeholder="maxCategoryValue - minCategoryValue" />
        {error !== null ? (
          <FieldError>{error}</FieldError>
        ) : (
          <Description>
            Calculated at each event and rounded down. Use a negative number for a deduction, for example
            -topTeamValue.
          </Description>
        )}
      </TextField>
      <Disclosure>
        <Disclosure.Heading>
          <Disclosure.Trigger className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted">
            What you can use in a formula
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="flex flex-col gap-3">
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              {TERMS.map((term) => (
                <div key={term.name} className="flex flex-col">
                  <dt className="font-mono text-foreground">{term.name}</dt>
                  <dd className="text-muted">{term.description}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted">
              Use + - * /, // (integer division), % (mod), round() ceil() floor() and parentheses. n starts at 1,
              the highest. For example teamPicks(6) or ceil(categoryValue(2) / 2).
            </p>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
