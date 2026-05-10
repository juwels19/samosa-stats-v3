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
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { QUERY_KEYS } from "@/constants/query-keys";
import { getGameNameForYear } from "@/lib/fetch/frc-events";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";

export default function CreateSeason() {
  const createSeasonFormSchema = z.object({
    year: z.string().regex(/^\d{4}$/, "Enter a four-digit year."),
    gameName: z.string().nonempty("Search for a valid season before saving."),
  });
  const createSeason = useMutation(api.seasons.create);

  const createSeasonForm = useForm<z.infer<typeof createSeasonFormSchema>>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(createSeasonFormSchema),
    defaultValues: {
      year: "",
      gameName: "",
    },
  });

  const yearToFetch = createSeasonForm.watch("year").trim();
  const shouldFetchGameName = /^\d{4}$/.test(yearToFetch);

  const {
    data: season,
    error: seasonError,
    isFetching: isFetchingSeason,
  } = useQuery({
    queryKey: [QUERY_KEYS.FrcEventsGameName, yearToFetch],
    queryFn: async () => {
      const gameName = await getGameNameForYear(yearToFetch);
      return { year: yearToFetch, gameName };
    },
    enabled: shouldFetchGameName,
  });

  useEffect(() => {
    if (season?.year === yearToFetch) {
      createSeasonForm.setValue("gameName", season.gameName, {
        shouldValidate: true,
      });
      return;
    }

    createSeasonForm.setValue("gameName", "", { shouldValidate: true });
  }, [createSeasonForm, season, yearToFetch]);

  const handleSubmit = async (data: z.infer<typeof createSeasonFormSchema>) => {
    try {
      await createSeason({
        year: Number(data.year),
        gameName: data.gameName,
      });
      toast.success("Season saved", {
        description: `${data.year} ${data.gameName} has been added.`,
      });
      createSeasonForm.reset();
    } catch (error) {
      toast.error("Season not saved", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          Add season
          <PlusIcon data-icon="inline-end" />
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
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
                {seasonError instanceof Error && shouldFetchGameName && (
                  <FieldError>{seasonError.message}</FieldError>
                )}
                {season?.year === yearToFetch && (
                  <p className="text-sm text-muted-foreground">
                    Game name: {season.gameName}
                  </p>
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
          <Button
            disabled={
              isFetchingSeason ||
              createSeasonForm.formState.isSubmitting ||
              !createSeasonForm.formState.isValid
            }
            onClick={createSeasonForm.handleSubmit(handleSubmit)}
          >
            {createSeasonForm.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
