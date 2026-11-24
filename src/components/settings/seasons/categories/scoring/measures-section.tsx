"use client";

import { Button } from "@heroui/react";
import { PlusIcon } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { DEFAULT_MEASURE, type ScoringFormValues } from "./form-values";
import MeasureCard from "./measure-card";

/** The list of named measures. */
export default function MeasuresSection({
  control,
  year,
}: {
  control: Control<ScoringFormValues>;
  year: number;
}) {
  const measures = useFieldArray({ control, name: "measures" });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Measures</h2>
          <p className="text-sm text-muted">
            Named values for each team. Use 2 measures for a ratio.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            measures.append({
              ...DEFAULT_MEASURE,
              name: `measure${measures.fields.length + 1}`,
            })
          }
        >
          <PlusIcon className="size-4" />
          Add measure
        </Button>
      </div>
      {measures.fields.map((measure, index) => (
        <MeasureCard
          key={measure.id}
          control={control}
          index={index}
          year={year}
          canRemove={measures.fields.length > 1}
          onRemove={() => measures.remove(index)}
        />
      ))}
    </section>
  );
}
