"use client";

import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { QUERY_KEYS } from "@/constants/query-keys";
import { getGameNameForYear } from "@/lib/fetch/frc-events";
import { useQuery } from "@tanstack/react-query";

export default function CreateSeason() {
  const createSeasonFormSchema = z.object({
    year: z.string().nonempty(),
    gameName: z.string().nonempty(),
  });

  const createSeasonForm = useForm<z.infer<typeof createSeasonFormSchema>>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(createSeasonFormSchema),
    defaultValues: {
      year: "",
    },
  });

  const yearToFetch = createSeasonForm.watch("year");

  const { data: gameName } = useQuery({
    queryKey: [QUERY_KEYS.FrcEventsGameName],
    queryFn: async () => {
      const gameName = await getGameNameForYear(yearToFetch);
      createSeasonForm.setValue("gameName", gameName);
      return gameName;
    },
  });

  const handleSubmit = async (data: z.infer<typeof createSeasonFormSchema>) => {
    console.log(data);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          Add season
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add season</DialogTitle>
        </DialogHeader>
        <form id="create-season">
          <Controller
            name="year"
            control={createSeasonForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="create-season-year">Year</FieldLabel>
                <Input
                  {...field}
                  id="create-season-year"
                  placeholder="Enter year..."
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
          <Button onClick={createSeasonForm.handleSubmit(handleSubmit)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
