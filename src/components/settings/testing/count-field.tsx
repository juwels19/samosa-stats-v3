"use client";

import { Label, NumberField } from "@heroui/react";

/** A whole-number field with +/- buttons. */
export default function CountField({
  label,
  value,
  min,
  max,
  onChange,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <NumberField
      className={className}
      minValue={min}
      maxValue={max}
      step={1}
      formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
      value={value}
      onChange={(next) => onChange(Number.isNaN(next) ? min : next)}
    >
      <Label>{label}</Label>
      <NumberField.Group className="h-11">
        <NumberField.DecrementButton className="h-full" />
        <NumberField.Input inputMode="numeric" className="h-full py-0 text-center" />
        <NumberField.IncrementButton className="h-full" />
      </NumberField.Group>
    </NumberField>
  );
}
