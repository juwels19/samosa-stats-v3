"use client";

import { Button, Description, FieldError, Input, Label, TextField } from "@heroui/react";
import { Controller, useWatch, type Control } from "react-hook-form";

import {
  getReferencedMeasures,
  parseFormula,
} from "../../../../../../convex/lib/scoring/formula";
import { VALUE_MODE_OPTIONS } from "./constants";
import type { ScoringFormValues } from "./form-values";
import { AiMark } from "./ai-marks";
import OptionSelect from "./option-select";

/** The value each team is ranked by: one measure, or a formula. */
export default function ValueSection({
  control,
}: {
  control: Control<ScoringFormValues>;
}) {
  const valueMode = useWatch({ control, name: "valueMode" });
  const measures = useWatch({ control, name: "measures" });
  const measureOptions = measures
    .map((measure) => measure.name.trim())
    .filter((name) => name !== "")
    .map((name) => ({ value: name, label: name }));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">Value</h2>
        <p className="text-sm text-muted">
          The number each team is compared by.
        </p>
      </div>
      <AiMark name="value">
        <div className="flex flex-col gap-3">
          <Controller
            control={control}
            name="valueMode"
            render={({ field }) => (
              <OptionSelect
                label="Value type"
                className="sm:w-56"
                value={field.value}
                options={VALUE_MODE_OPTIONS}
                onChange={field.onChange}
              />
            )}
          />
          {valueMode === "measure" ? (
            <Controller
              control={control}
              name="valueMeasure"
              render={({ field }) => (
                <OptionSelect
                  label="Measure"
                  className="sm:w-56"
                  value={field.value}
                  options={measureOptions}
                  onChange={field.onChange}
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="formula"
              render={({ field }) => (
                <FormulaField
                  value={field.value}
                  onChange={field.onChange}
                  measureNames={measureOptions.map((option) => option.value)}
                />
              )}
            />
          )}
        </div>
      </AiMark>
    </section>
  );
}

/**
 * A formula of measure names and numbers, for example
 * `(auto - teleop) / matches * 100`. Tap a measure name to add it.
 */
function FormulaField({
  value,
  onChange,
  measureNames,
}: {
  value: string;
  onChange: (value: string) => void;
  measureNames: string[];
}) {
  const parsed = value.trim() === "" ? null : parseFormula(value);
  const unknown =
    parsed?.ok === true
      ? [...new Set(getReferencedMeasures(parsed.expression))].filter((name) => !measureNames.includes(name))
      : [];
  const error =
    parsed !== null && !parsed.ok
      ? parsed.message
      : unknown.length > 0
        ? `No measure is named ${unknown.map((name) => `"${name}"`).join(", ")}.`
        : null;

  const insert = (name: string) => {
    const trimmed = value.trimEnd();
    const needsOperator = trimmed !== "" && /[A-Za-z0-9_)]$/.test(trimmed);
    onChange(trimmed === "" ? name : `${trimmed}${needsOperator ? " + " : " "}${name}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <TextField fullWidth value={value} onChange={onChange} isInvalid={error !== null}>
        <Label>Formula</Label>
        <Input
          placeholder="(auto - teleop) / matches * 100"
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-sm"
        />
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <Description>
            Use measure names, numbers, + − × ÷ and parentheses. × and ÷ come before + and −.
          </Description>
        )}
      </TextField>
      {measureNames.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Add a measure:</span>
          {measureNames.map((name) => (
            <Button
              key={name}
              size="sm"
              variant="tertiary"
              className="font-mono"
              onPress={() => insert(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
