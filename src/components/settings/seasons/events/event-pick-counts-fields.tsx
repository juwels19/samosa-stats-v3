"use client";

import { FieldError, Label, NumberField } from "@heroui/react";

type EventPickCountsFieldsProps = {
  numberOfTeamPicks: string;
  numberOfCategoryPicks: string;
  onNumberOfTeamPicksChange: (value: string) => void;
  onNumberOfCategoryPicksChange: (value: string) => void;
  showValidation: boolean;
  teamPicksError?: string;
  categoryPicksError?: string;
  idPrefix: string;
};

export default function EventPickCountsFields({
  numberOfTeamPicks,
  numberOfCategoryPicks,
  onNumberOfTeamPicksChange,
  onNumberOfCategoryPicksChange,
  showValidation,
  teamPicksError,
  categoryPicksError,
  idPrefix,
}: EventPickCountsFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PickCountField
        id={`${idPrefix}-team-picks`}
        label="Number of team picks"
        value={numberOfTeamPicks}
        onChange={onNumberOfTeamPicksChange}
        error={showValidation ? teamPicksError : undefined}
      />
      <PickCountField
        id={`${idPrefix}-category-picks`}
        label="Number of category picks"
        value={numberOfCategoryPicks}
        onChange={onNumberOfCategoryPicksChange}
        error={showValidation ? categoryPicksError : undefined}
      />
    </div>
  );
}

/** Keeps the string value the zod schema expects. An empty field is NaN. */
function PickCountField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <NumberField
      id={id}
      fullWidth
      minValue={1}
      step={1}
      formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
      value={value === "" ? Number.NaN : Number(value)}
      onChange={(nextValue) =>
        onChange(Number.isNaN(nextValue) ? "" : String(nextValue))
      }
      isInvalid={Boolean(error)}
    >
      <Label>{label}</Label>
      {/* 44px row so the +/- buttons are full touch targets and stay centred. */}
      <NumberField.Group className="h-11">
        <NumberField.DecrementButton className="h-full" />
        <NumberField.Input inputMode="numeric" className="h-full py-0 text-center" />
        <NumberField.IncrementButton className="h-full" />
      </NumberField.Group>
      {error ? <FieldError>{error}</FieldError> : null}
    </NumberField>
  );
}
