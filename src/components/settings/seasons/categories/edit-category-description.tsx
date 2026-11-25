"use client";

import { Button, Description, FieldError, Label, Modal, Spinner, TextArea, TextField, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

const MAX_LENGTH = 500;

/** Edits a category's scoring description. Scoring does not use the text. */
export default function EditCategoryDescription({
  categoryId,
  categoryText,
  scoringDescription,
}: {
  categoryId: Id<"categories">;
  categoryText: string;
  scoringDescription: string;
}) {
  const updateDescription = useMutation(api.categories.updateDescription);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(scoringDescription);
  const [isSaving, setIsSaving] = useState(false);
  const tooLong = value.trim().length > MAX_LENGTH;

  function handleOpenChange(next: boolean) {
    if (isSaving) return;
    setOpen(next);
    if (next) setValue(scoringDescription);
  }

  async function save() {
    setIsSaving(true);
    try {
      await updateDescription({ categoryId, scoringDescription: value });
      toast.success("Scoring description saved");
      setIsSaving(false);
      setOpen(false);
    } catch (error) {
      toast.danger("Scoring description not saved", {
        description: error instanceof Error ? error.message : "Try again.",
      });
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="tertiary"
        aria-label={`Edit the scoring description of ${categoryText}`}
        onPress={() => handleOpenChange(true)}
      >
        <PencilIcon className="size-4" aria-hidden />
        Edit
      </Button>

      <Modal.Backdrop isOpen={open} onOpenChange={handleOpenChange} isDismissable={!isSaving}>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Scoring description</Modal.Heading>
              <p className="text-sm text-muted">{categoryText}</p>
            </Modal.Header>
            <Modal.Body>
              <TextField fullWidth value={value} onChange={setValue} isInvalid={tooLong} autoFocus>
                <Label>Description</Label>
                <TextArea rows={5} placeholder="Explain how this category is won." />
                {tooLong ? (
                  <FieldError>Use {MAX_LENGTH} characters or fewer.</FieldError>
                ) : (
                  <Description>
                    {MAX_LENGTH - value.trim().length} characters left. Leave it empty to remove it.
                  </Description>
                )}
              </TextField>
            </Modal.Body>
            <Modal.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="secondary" isDisabled={isSaving} onPress={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                isDisabled={tooLong || value.trim() === scoringDescription.trim()}
                isPending={isSaving}
                onPress={() => void save()}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    Save
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
