"use client";

import { Radio, RadioGroup } from "@heroui/react";

import type { Option } from "./constants";

const GRID_COLUMNS: Record<number, string> = {
  2: "grid gap-2 sm:grid-cols-2",
  3: "grid gap-2 sm:grid-cols-3",
  4: "grid gap-2 sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Cards to choose one option, for example how winners are found. The whole
 * card is the clickable `Radio.Content`, so a tap anywhere selects it.
 */
export default function WinnerModeField<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onChange={(next) => {
        const match = options.find((option) => option.value === next);
        if (match) onChange(match.value);
      }}
    >
      <div className={GRID_COLUMNS[options.length] ?? "grid gap-2 sm:grid-cols-2"}>
        {options.map((option) => (
          <Radio key={option.value} value={option.value} className="mt-0 w-full">
            <Radio.Content className="h-full w-full cursor-pointer items-start rounded-2xl border border-border p-3 transition-colors duration-150 ease-out not-data-[selected]:hover:bg-default data-[selected]:border-accent data-[selected]:bg-accent-soft">
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
