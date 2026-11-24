"use client";

import { Input, Label, TextField } from "@heroui/react";
import { Controller, useWatch, type Control } from "react-hook-form";

import { CALCULATION_OP_OPTIONS, VALUE_MODE_OPTIONS } from "./constants";
import type { ScoringFormValues } from "./form-values";
import OptionSelect from "./option-select";

/** The value each team is ranked by: one measure, or a calculation. */
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
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <Controller
            control={control}
            name="left"
            render={({ field }) => (
              <TextField
                fullWidth
                value={field.value}
                onChange={field.onChange}
              >
                <Label>Left</Label>
                <Input
                  placeholder="Measure name or number"
                  autoComplete="off"
                  className="font-mono text-sm"
                />
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="calculationOp"
            render={({ field }) => (
              <OptionSelect
                label="Operation"
                className="sm:w-24"
                value={field.value}
                options={CALCULATION_OP_OPTIONS}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="right"
            render={({ field }) => (
              <TextField
                fullWidth
                value={field.value}
                onChange={field.onChange}
              >
                <Label>Right</Label>
                <Input
                  placeholder="Measure name or number"
                  autoComplete="off"
                  className="font-mono text-sm"
                />
              </TextField>
            )}
          />
        </div>
      )}
    </section>
  );
}
