"use client";

import { Description, Label, ListBox, Select } from "@heroui/react";

import type { Option } from "./constants";

/** A single-choice select for a fixed list of options. */
export default function OptionSelect<Value extends string>({
  label,
  description,
  hideLabel = false,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  description?: string;
  hideLabel?: boolean;
  value: Value;
  options: readonly Option<Value>[];
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <Select
      aria-label={hideLabel ? label : undefined}
      className={className}
      value={value}
      onChange={(key) => {
        const option = options.find((item) => item.value === key);
        if (option) onChange(option.value);
      }}
    >
      {hideLabel ? null : <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {description ? <Description>{description}</Description> : null}
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.value}
              id={option.value}
              textValue={option.label}
            >
              <div className="flex flex-col pr-7">
                <Label>{option.label}</Label>
                {option.description ? (
                  <Description>{option.description}</Description>
                ) : null}
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
