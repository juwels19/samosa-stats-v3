"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Globe2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { api } from "../../../../../convex/_generated/api";
import { createCategoryFormSchema } from "./constants";

export default function CreateCategory({
  hasActiveSeason = true,
}: {
  hasActiveSeason?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const createCategory = useMutation(api.categories.create);
  const createCategoryForm = useForm<z.infer<typeof createCategoryFormSchema>>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      text: "",
      isGlobal: false,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      createCategoryForm.reset({ text: "", isGlobal: false });
    }
  };

  const handleSubmit = async (
    data: z.infer<typeof createCategoryFormSchema>,
  ) => {
    try {
      await createCategory({
        text: data.text,
        isGlobal: data.isGlobal,
      });
      toast.success("Category saved", {
        description: `${data.text.trim()} has been added.`,
      });
      createCategoryForm.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Category not saved", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!hasActiveSeason}>
          Add category
          <PlusIcon data-icon="inline-end" />
        </Button>
      </DialogTrigger>
      {!hasActiveSeason && (
        <p className="mt-2 text-right text-sm text-muted-foreground">
          Set an active season before creating categories.
        </p>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
        </DialogHeader>
        <form
          id="create-category"
          className="space-y-6"
          onSubmit={createCategoryForm.handleSubmit(handleSubmit)}
        >
          <Controller
            name="text"
            control={createCategoryForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="create-category-text">
                  Category text
                </FieldLabel>
                <Input
                  {...field}
                  id="create-category-text"
                  placeholder="Top 3 teams left out of elims, 3rd most fouls..."
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="isGlobal"
            control={createCategoryForm.control}
            render={({ field }) => (
              <Field>
                <Item
                  variant="muted"
                  asChild
                  data-selected={field.value}
                  className="cursor-pointer items-start rounded-3xl border p-4 data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/20"
                >
                  <label htmlFor="create-category-is-global">
                    <Checkbox
                      id="create-category-is-global"
                      className="mt-0.5"
                      checked={field.value}
                      onBlur={field.onBlur}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      ref={field.ref}
                    />
                    <ItemContent>
                      <ItemTitle>
                        <Globe2Icon className="size-4" />
                        Global category
                      </ItemTitle>
                      <ItemDescription>
                        Show this category in the Global group.
                      </ItemDescription>
                    </ItemContent>
                  </label>
                </Item>
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="create-category"
            disabled={
              !hasActiveSeason ||
              createCategoryForm.formState.isSubmitting ||
              !createCategoryForm.formState.isValid
            }
          >
            {createCategoryForm.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
