"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { XIcon } from "lucide-react";
import { Controller, useWatch, type Control } from "react-hook-form";

import type { ScoringSource } from "../../../../../../convex/lib/scoring/winner_config";
import { FILTER_OP_OPTIONS, FILTER_SOURCE_OPTIONS } from "./constants";
import FieldPathComboBox from "./field-path-combo-box";
import type { ScoringFormValues } from "./form-values";
import { getFilterValueOptions } from "./get-filter-value-options";
import OptionSelect from "./option-select";
import { useFieldPaths } from "./use-field-paths";
import ValueOptionsComboBox from "./value-options-combo-box";

/**
 * One `where` filter of a measure. With another source, it keeps teams that
 * have a matching row in that source.
 */
export default function FilterRow({
  control,
  measureIndex,
  filterIndex,
  measureSource,
  year,
  onRemove,
}: {
  control: Control<ScoringFormValues>;
  measureIndex: number;
  filterIndex: number;
  measureSource: ScoringSource;
  year: number;
  onRemove: () => void;
}) {
  const name = `measures.${measureIndex}.where.${filterIndex}` as const;
  const op = useWatch({ control, name: `${name}.op` });
  const fieldPath = useWatch({ control, name: `${name}.field` });
  const filterSource = useWatch({ control, name: `${name}.source` });
  const source = filterSource === "measure" ? measureSource : filterSource;
  const isList = op === "in" || op === "notIn";
  const isComparison =
    op === "gt" || op === "gte" || op === "lt" || op === "lte";
  const fieldPaths = useFieldPaths(source, year);
  const valueOptions = isComparison
    ? undefined
    : getFilterValueOptions(source, fieldPath, fieldPaths);

  return (
    <div className="grid gap-2 rounded-xl border border-border p-3 lg:grid-cols-[11rem_1fr_9rem_1fr_auto] lg:items-start">
      <Controller
        control={control}
        name={`${name}.source`}
        render={({ field }) => (
          <OptionSelect
            label="Source"
            value={field.value}
            options={FILTER_SOURCE_OPTIONS}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name={`${name}.field`}
        render={({ field }) => (
          <FieldPathComboBox
            label="Field"
            source={source}
            year={year}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name={`${name}.op`}
        render={({ field }) => (
          <OptionSelect
            label="Comparison"
            value={field.value}
            options={FILTER_OP_OPTIONS}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name={`${name}.value`}
        render={({ field }) =>
          valueOptions ? (
            <ValueOptionsComboBox
              key={`${fieldPath}-${isList}`}
              label={isList ? "Values" : "Value"}
              options={valueOptions}
              isMultiple={isList}
              value={field.value}
              onChange={field.onChange}
            />
          ) : (
            <TextField fullWidth value={field.value} onChange={field.onChange}>
              <Label>{isList ? "Values, separated by commas" : "Value"}</Label>
              <Input
                placeholder={isList ? "sf, f" : "Level3"}
                autoComplete="off"
                className="font-mono text-sm"
              />
            </TextField>
          )
        }
      />
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Remove filter"
        className="justify-self-end lg:mt-7"
        onPress={onRemove}
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}
