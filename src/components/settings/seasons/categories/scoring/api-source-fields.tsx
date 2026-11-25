"use client";

import { Description, Input, Label, TextField } from "@heroui/react";
import { Controller, type Control } from "react-hook-form";

import { API_SERVICE_OPTIONS } from "./constants";
import type { ScoringFormValues } from "./form-values";
import OptionSelect from "./option-select";

/** The endpoint, row list and team path of a custom source. */
export default function ApiSourceFields({
  control,
  index,
}: {
  control: Control<ScoringFormValues>;
  index: number;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[12rem_1fr]">
      <Controller
        control={control}
        name={`measures.${index}.apiService`}
        render={({ field }) => (
          <OptionSelect
            label="Service"
            value={field.value}
            options={API_SERVICE_OPTIONS}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name={`measures.${index}.apiPath`}
        render={({ field }) => (
          <TextField fullWidth value={field.value} onChange={field.onChange}>
            <Label>Endpoint path</Label>
            <Input autoComplete="off" className="font-mono text-sm" />
            <Description>
              Use {"{eventKey}"}, {"{eventCode}"} and {"{year}"}. They change
              for each event.
            </Description>
          </TextField>
        )}
      />
      <Controller
        control={control}
        name={`measures.${index}.apiRows`}
        render={({ field }) => (
          <TextField fullWidth value={field.value} onChange={field.onChange}>
            <Label>Rows at</Label>
            <Input
              autoComplete="off"
              placeholder="Response is the list"
              className="font-mono text-sm"
            />
          </TextField>
        )}
      />
      <Controller
        control={control}
        name={`measures.${index}.apiTeam`}
        render={({ field }) => (
          <TextField fullWidth value={field.value} onChange={field.onChange}>
            <Label>Team in each row</Label>
            <Input autoComplete="off" className="font-mono text-sm" />
            <Description>
              A * makes one row for each match. $context in a field reads the
              object at the first *. Use $key when the rows are an object keyed
              by team, and read the number from the field value.
            </Description>
          </TextField>
        )}
      />
    </div>
  );
}
