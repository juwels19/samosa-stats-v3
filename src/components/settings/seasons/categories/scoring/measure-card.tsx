"use client";

import { Button, Description, Input, Label, TextField } from "@heroui/react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
} from "react-hook-form";

import { AiMark } from "./ai-marks";
import ApiSourceFields from "./api-source-fields";
import { MEASURE_OP_OPTIONS, MEASURE_SOURCE_OPTIONS } from "./constants";
import FieldPathComboBox from "./field-path-combo-box";
import FilterRow from "./filter-row";
import { EMPTY_FILTER, type ScoringFormValues } from "./form-values";
import OptionSelect from "./option-select";

/** One named measure: source, filters, field and operation. */
export default function MeasureCard({
  control,
  index,
  year,
  canRemove,
  onRemove,
}: {
  control: Control<ScoringFormValues>;
  index: number;
  year: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const source = useWatch({ control, name: `measures.${index}.source` });
  const op = useWatch({ control, name: `measures.${index}.op` });
  const filters = useFieldArray({ control, name: `measures.${index}.where` });

  return (
    <AiMark name={`measures.${index}`}>
      <div className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <AiMark name={`measures.${index}.name`}>
            <Controller
              control={control}
              name={`measures.${index}.name`}
              render={({ field }) => (
                <TextField
                  fullWidth
                  value={field.value}
                  onChange={field.onChange}
                >
                  <Label>Measure name</Label>
                  <Input autoComplete="off" className="font-mono text-sm" />
                </TextField>
              )}
            />
          </AiMark>
          <AiMark name={`measures.${index}.source`}>
            <Controller
              control={control}
              name={`measures.${index}.source`}
              render={({ field }) => (
                <OptionSelect
                  label="Source"
                  value={field.value}
                  options={MEASURE_SOURCE_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
          </AiMark>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Remove measure"
            isDisabled={!canRemove}
            className="justify-self-end"
            onPress={onRemove}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>

        {source === "api" ? (
          <AiMark name={`measures.${index}.api`}>
            <ApiSourceFields control={control} index={index} />
          </AiMark>
        ) : null}

        <AiMark name={`measures.${index}.where`}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Only rows where</p>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => filters.append(EMPTY_FILTER)}
              >
                <PlusIcon className="size-4" />
                Add filter
              </Button>
            </div>
            {filters.fields.length === 0 ? (
              <p className="text-sm text-muted">All rows for the team.</p>
            ) : (
              filters.fields.map((filter, filterIndex) => (
                <FilterRow
                  key={filter.id}
                  control={control}
                  measureIndex={index}
                  filterIndex={filterIndex}
                  measureSource={source}
                  year={year}
                  onRemove={() => filters.remove(filterIndex)}
                />
              ))
            )}
          </div>
        </AiMark>

        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
          <AiMark name={`measures.${index}.op`}>
            <Controller
              control={control}
              name={`measures.${index}.op`}
              render={({ field }) => (
                <OptionSelect
                  label="Operation"
                  className="sm:w-44"
                  value={field.value}
                  options={MEASURE_OP_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
          </AiMark>
          {op === "count" ? null : (
            <AiMark name={`measures.${index}.field`}>
              <Controller
                control={control}
                name={`measures.${index}.field`}
                render={({ field }) =>
                  source === "api" ? (
                    <TextField
                      fullWidth
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <Label>Field</Label>
                      <Input autoComplete="off" className="font-mono text-sm" />
                      <Description>
                        A path in each row. The preview checks that it has
                        numbers.
                      </Description>
                    </TextField>
                  ) : (
                    <FieldPathComboBox
                      label="Field"
                      source={source}
                      year={year}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )
                }
              />
            </AiMark>
          )}
        </div>
      </div>
    </AiMark>
  );
}
