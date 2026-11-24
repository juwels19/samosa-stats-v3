"use client";

import { Description, Input, Label, TextField } from "@heroui/react";
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
    <TextField
      fullWidth
      value={displayName}
      maxLength={MAX_PICK_DISPLAY_NAME_LENGTH}
      isDisabled={disabled}
      onChange={onDisplayNameChange}
    >
      <Label>Display name (optional)</Label>
      <Input placeholder="Optional name for your picks" autoComplete="off" />
      <Description>
        {MAX_PICK_DISPLAY_NAME_LENGTH - displayName.length} characters left
      </Description>
    </TextField>
  );
}
