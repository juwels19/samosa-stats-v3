"use client";

import { ComboBox, Description, Input, Label, ListBox } from "@heroui/react";

import type { ValueOption } from "./get-filter-value-options";
import { matchSearchText } from "./match-search-text";

/**
 * A searchable list of the values a filter can use. With `isMultiple`, the
 * form value is a comma-separated list.
 */
export default function ValueOptionsComboBox({
  label,
  options,
  isMultiple,
  value,
  onChange,
}: {
  label: string;
  options: ValueOption[];
  isMultiple: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedIds = isMultiple
    ? value
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part !== "")
    : value.trim() === ""
      ? []
      : [value.trim()];
  // Keep saved values that are not in the list, so they stay visible.
  const unknownIds = selectedIds.filter(
    (id) => !options.some((o) => o.id === id),
  );
  const items: ValueOption[] = [
    ...unknownIds.map((id) => ({
      id,
      label: id,
      description: "Not in the list",
    })),
    ...options,
  ];
  const isInvalid = unknownIds.length > 0;
  const filter = matchSearchText(
    new Map(
      items.map((option) => [option.label, option.keywords ?? option.label]),
    ),
  );

  const list = (
    <ListBox selectionMode={isMultiple ? "multiple" : "single"}>
      {items.map((option) => (
        <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
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
  );

  if (isMultiple) {
    return (
      <ComboBox
        fullWidth
        selectionMode="multiple"
        value={selectedIds}
        onChange={(keys) =>
          onChange((Array.isArray(keys) ? keys : []).map(String).join(", "))
        }
        isInvalid={isInvalid}
        defaultFilter={filter}
        menuTrigger="focus"
      >
        <Label>{label}</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search values" />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Value placeholder="No values selected" />
        <ComboBox.Popover>{list}</ComboBox.Popover>
      </ComboBox>
    );
  }

  return (
    <ComboBox
      fullWidth
      selectedKey={selectedIds[0] ?? null}
      onSelectionChange={(key) => {
        if (key !== null) onChange(String(key));
      }}
      isInvalid={isInvalid}
      defaultFilter={filter}
      menuTrigger="focus"
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder="Search values" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {isInvalid ? (
        <Description className="text-danger">
          {selectedIds[0]} is not an allowed value.
        </Description>
      ) : null}
      <ComboBox.Popover>{list}</ComboBox.Popover>
    </ComboBox>
  );
}
