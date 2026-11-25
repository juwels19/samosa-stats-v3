"use client";

import { Input, Label, TextField } from "@heroui/react";
import { Controller, useWatch, type Control } from "react-hook-form";

import {
  ORDER_OPTIONS,
  SELECT_TYPE_OPTIONS,
  THRESHOLD_OP_OPTIONS,
} from "./constants";
import type { ScoringFormValues } from "./form-values";
import { AiMark } from "./ai-marks";
import OptionSelect from "./option-select";

/** The rule that picks the winning teams from their values. */
export default function SelectRuleSection({
  control,
}: {
  control: Control<ScoringFormValues>;
}) {
  const selectType = useWatch({ control, name: "selectType" });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">Winners</h2>
        <p className="text-sm text-muted">
          How the winning teams are picked. Tied teams all win.
        </p>
      </div>
      <AiMark name="select">
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <Controller
            control={control}
            name="selectType"
            render={({ field }) => (
              <OptionSelect
                label="Rule"
                value={field.value}
                options={SELECT_TYPE_OPTIONS}
                onChange={field.onChange}
              />
            )}
          />
          {selectType === "nth" || selectType === "top" ? (
            <>
              <Controller
                control={control}
                name="n"
                render={({ field }) => (
                  <TextField
                    fullWidth
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <Label>
                      {selectType === "nth"
                        ? "Place (n)"
                        : "Number of teams (n)"}
                    </Label>
                    <Input inputMode="numeric" autoComplete="off" />
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="order"
                render={({ field }) => (
                  <OptionSelect
                    label="Order"
                    value={field.value}
                    options={ORDER_OPTIONS}
                    onChange={field.onChange}
                  />
                )}
              />
            </>
          ) : (
            <>
              {selectType === "threshold" ? (
                <Controller
                  control={control}
                  name="thresholdOp"
                  render={({ field }) => (
                    <OptionSelect
                      label="Comparison"
                      value={field.value}
                      options={THRESHOLD_OP_OPTIONS}
                      onChange={field.onChange}
                    />
                  )}
                />
              ) : null}
              <Controller
                control={control}
                name="selectValue"
                render={({ field }) => (
                  <TextField
                    fullWidth
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <Label>Number</Label>
                    <Input inputMode="decimal" autoComplete="off" />
                  </TextField>
                )}
              />
            </>
          )}
        </div>
      </AiMark>
    </section>
  );
}
