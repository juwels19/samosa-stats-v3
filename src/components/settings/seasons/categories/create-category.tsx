"use client";

import {
  Button,
  Checkbox,
  Description,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Globe2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { api } from "../../../../../convex/_generated/api";
import { createCategoryFormSchema } from "./constants";

type CreateCategoryFormValues = z.infer<typeof createCategoryFormSchema>;

const EMPTY_VALUES: CreateCategoryFormValues = {
  text: "",
  scoringDescription: "",
  isGlobal: false,
};

export default function CreateCategory({
  hasActiveSeason = true,
}: {
  hasActiveSeason?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const createCategory = useMutation(api.categories.create);
  const createCategoryForm = useForm<CreateCategoryFormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) createCategoryForm.reset(EMPTY_VALUES);
  };

  const handleSubmit = async (data: CreateCategoryFormValues) => {
    try {
      await createCategory({
        text: data.text,
        scoringDescription: data.scoringDescription.trim(),
        isGlobal: data.isGlobal,
      });
      toast.success("Category saved", {
        description: `${data.text.trim()} is added.`,
      });
      handleOpenChange(false);
    } catch (error) {
      toast.danger("Category not saved", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    }
  };

  const isSubmitting = createCategoryForm.formState.isSubmitting;

  return (
    <>
      <Button
        size="lg"
        className="w-full sm:w-auto"
        isDisabled={!hasActiveSeason}
        onPress={() => setOpen(true)}
      >
        <PlusIcon className="size-4" />
        New category
      </Button>
      <Modal.Backdrop
        isOpen={open}
        onOpenChange={handleOpenChange}
        isDismissable={!isSubmitting}
      >
        <Modal.Container placement="auto" scroll="inside">
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>New category</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form
                id="create-category"
                className="flex flex-col gap-5"
                onSubmit={createCategoryForm.handleSubmit(handleSubmit)}
              >
                <Controller
                  name="text"
                  control={createCategoryForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      fullWidth
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={fieldState.invalid}
                    >
                      <Label>Category text</Label>
                      <Input
                        ref={field.ref}
                        placeholder="Top 3 teams left out of elims"
                        autoComplete="off"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </TextField>
                  )}
                />
                <Controller
                  name="scoringDescription"
                  control={createCategoryForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      fullWidth
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={fieldState.invalid}
                    >
                      <Label>Scoring description</Label>
                      <TextArea
                        ref={field.ref}
                        placeholder="Explain how to score this category."
                        rows={4}
                      />
                      <Description>Notes for scoring this category.</Description>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </TextField>
                  )}
                />
                <Controller
                  name="isGlobal"
                  control={createCategoryForm.control}
                  render={({ field }) => (
                    <Checkbox
                      isSelected={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className="rounded-2xl border border-border p-4 data-[selected=true]:border-accent data-[selected=true]:bg-accent-soft"
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <span className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            <Globe2Icon className="size-4" aria-hidden />
                            Global category
                          </span>
                          <span className="text-sm text-muted">
                            Show this category in the Global group.
                          </span>
                        </span>
                      </Checkbox.Content>
                    </Checkbox>
                  )}
                />
              </form>
            </Modal.Body>
            <Modal.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="secondary"
                isDisabled={isSubmitting}
                onPress={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-category"
                isPending={isSubmitting}
                isDisabled={
                  !hasActiveSeason || !createCategoryForm.formState.isValid
                }
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Saving" : "Save"}
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
