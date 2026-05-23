"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_PICK_DISPLAY_NAME_LENGTH } from "./constants";

export default function DisplayNameField({
  displayName,
  disabled = false,
  onDisplayNameChange,
}: {
  displayName: string;
  disabled?: boolean;
  onDisplayNameChange: (displayName: string) => void;
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="pick-display-name">
          Display name (optional)
        </FieldLabel>
        <Input
          id="pick-display-name"
          value={displayName}
          maxLength={MAX_PICK_DISPLAY_NAME_LENGTH}
          placeholder="Optional name for your picks"
          disabled={disabled}
          onChange={(event) => onDisplayNameChange(event.target.value)}
        />
        <FieldDescription>
          {MAX_PICK_DISPLAY_NAME_LENGTH - displayName.length} characters
          remaining.
        </FieldDescription>
      </Field>
    </FieldGroup>
  );
}
