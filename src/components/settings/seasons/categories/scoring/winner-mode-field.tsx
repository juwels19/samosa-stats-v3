"use client";

import { Label, Radio, RadioGroup } from "@heroui/react";

import { WINNER_MODE_OPTIONS } from "./constants";

/**
 * Chooses between automatic winners from a config and manual winners. The
 * whole card is the clickable `Radio.Content`, so a tap anywhere selects it.
 */
export default function WinnerModeField({
  value,
  onChange,
}: {
  value: "config" | "manual";
  onChange: (value: "config" | "manual") => void;
}) {
  return (
    <RadioGroup
      value={value}
      onChange={(next) => onChange(next === "manual" ? "manual" : "config")}
    >
      <Label>How winners are found</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {WINNER_MODE_OPTIONS.map((option) => (
          <Radio key={option.value} value={option.value} className="w-full">
            <Radio.Content className="h-full w-full cursor-pointer items-start rounded-2xl border border-border p-4 transition-colors duration-150 ease-out not-data-[selected]:hover:bg-default data-[selected]:border-accent data-[selected]:bg-accent-soft">
              <Radio.Control className="mt-0.5">
                <Radio.Indicator />
              </Radio.Control>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-sm text-muted">{option.description}</span>
              </span>
            </Radio.Content>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
