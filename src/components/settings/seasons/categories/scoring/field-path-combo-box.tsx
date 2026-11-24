"use client";

import { ComboBox, Description, Input, Label, ListBox } from "@heroui/react";

import { isKnownFieldPath } from "../../../../../../convex/lib/scoring/field_paths";
import type { ScoringSource } from "../../../../../../convex/lib/scoring/winner_config";
import { useFieldPaths } from "./use-field-paths";

/** Picks a field path from the season's schema. Custom paths are allowed. */
export default function FieldPathComboBox({
  label,
  source,
  year,
  value,
  onChange,
}: {
  label: string;
  source: ScoringSource;
  year: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const fieldPaths = useFieldPaths(source, year);
  const isUnknown = value.trim() !== "" && !isKnownFieldPath(fieldPaths, value);
  const isOpen = fieldPaths.openPrefixes.length > 0;

  return (
    <ComboBox
      allowsCustomValue
      fullWidth
      inputValue={value}
      onInputChange={onChange}
      onSelectionChange={(key) => {
        if (typeof key === "string") onChange(key);
      }}
      isInvalid={isUnknown}
      menuTrigger="focus"
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder="Choose a field" className="font-mono text-sm" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {isUnknown ? (
        <Description className="text-danger">
          Not a field of this source in {year}.
        </Description>
      ) : isOpen ? (
        <Description>
          {year} has no schema under {fieldPaths.openPrefixes.join(", ")}. Any
          path there is allowed.
        </Description>
      ) : null}
      <ComboBox.Popover>
        <ListBox>
          {fieldPaths.paths.map((path) => (
            <ListBox.Item key={path} id={path} textValue={path}>
              <span className="font-mono text-sm">{path}</span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
