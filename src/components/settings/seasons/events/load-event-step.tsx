"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { QUERY_KEYS } from "@/constants/query-keys";
import { getEventForYearAndCode } from "@/lib/fetch/frc-events";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import {
  createEventDetailsSchema,
  type CreateEventModalData,
} from "@/components/events/constants";
import EventLoadStatus from "./event-load-status";
import { isEventCodeReady } from "@/components/events/utils";

export default function LoadEventStep({
  activeSeason,
}: {
  activeSeason: Doc<"seasons"> | null;
}) {
  const { data, updateData } = useMultiStepModal<CreateEventModalData>();
  const validationResult = createEventDetailsSchema.safeParse(data);
  const fieldErrors = validationResult.success
    ? {}
    : validationResult.error.flatten().fieldErrors;
  const eventCode = data.eventCode.trim();
  const shouldFetchEvent = activeSeason !== null && isEventCodeReady(eventCode);
  const shouldShowValidation = data.hasSubmittedDetails;
  const eventQuery = useQuery({
    queryKey: [QUERY_KEYS.FrcEventsEvent, activeSeason?.year, eventCode],
    queryFn: async () => {
      if (activeSeason === null) {
        throw new Error("Choose an active season before loading an event.");
      }

      return await getEventForYearAndCode({
        year: activeSeason.year,
        eventCode,
      });
    },
    enabled: shouldFetchEvent,
    retry: false,
  });

  useEffect(() => {
    if (!shouldFetchEvent || eventQuery.isError) {
      updateData({ loadedEvent: null });
      return;
    }

    if (eventQuery.data) {
      updateData({ loadedEvent: eventQuery.data });
    }
  }, [eventQuery.data, eventQuery.isError, shouldFetchEvent, updateData]);

  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          data-invalid={
            shouldShowValidation && Boolean(fieldErrors.eventCode?.length)
          }
        >
          <FieldLabel htmlFor="create-event-code">Event code</FieldLabel>
          <Input
            id="create-event-code"
            value={data.eventCode}
            onChange={(event) =>
              updateData({
                eventCode: event.target.value,
                loadedEvent: null,
              })
            }
            placeholder="e.g. onnew"
            autoComplete="off"
            aria-invalid={
              shouldShowValidation && Boolean(fieldErrors.eventCode?.length)
            }
          />
          <FieldDescription>
            Enter the event code without the year.
          </FieldDescription>
          {shouldShowValidation && fieldErrors.eventCode && (
            <FieldError>{fieldErrors.eventCode[0]}</FieldError>
          )}
        </Field>
        <Field
          data-invalid={
            shouldShowValidation && Boolean(fieldErrors.displayName?.length)
          }
        >
          <FieldLabel htmlFor="create-event-display-name">
            Display name
          </FieldLabel>
          <Input
            id="create-event-display-name"
            value={data.displayName}
            onChange={(event) =>
              updateData({ displayName: event.target.value })
            }
            placeholder="Enter a display name"
            autoComplete="off"
            aria-invalid={
              shouldShowValidation && Boolean(fieldErrors.displayName?.length)
            }
          />
          {shouldShowValidation && fieldErrors.displayName && (
            <FieldError>{fieldErrors.displayName[0]}</FieldError>
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          data-invalid={
            shouldShowValidation &&
            Boolean(fieldErrors.numberOfTeamPicks?.length)
          }
        >
          <FieldLabel htmlFor="create-event-team-picks">
            Number of team picks
          </FieldLabel>
          <Input
            id="create-event-team-picks"
            type="number"
            min={1}
            value={data.numberOfTeamPicks}
            onChange={(event) =>
              updateData({ numberOfTeamPicks: event.target.value })
            }
            aria-invalid={
              shouldShowValidation &&
              Boolean(fieldErrors.numberOfTeamPicks?.length)
            }
          />
          {shouldShowValidation && fieldErrors.numberOfTeamPicks && (
            <FieldError>{fieldErrors.numberOfTeamPicks[0]}</FieldError>
          )}
        </Field>
        <Field
          data-invalid={
            shouldShowValidation &&
            Boolean(fieldErrors.numberOfCategoryPicks?.length)
          }
        >
          <FieldLabel htmlFor="create-event-category-picks">
            Number of category picks
          </FieldLabel>
          <Input
            id="create-event-category-picks"
            type="number"
            min={1}
            value={data.numberOfCategoryPicks}
            onChange={(event) =>
              updateData({ numberOfCategoryPicks: event.target.value })
            }
            aria-invalid={
              shouldShowValidation &&
              Boolean(fieldErrors.numberOfCategoryPicks?.length)
            }
          />
          {shouldShowValidation && fieldErrors.numberOfCategoryPicks && (
            <FieldError>{fieldErrors.numberOfCategoryPicks[0]}</FieldError>
          )}
        </Field>
      </div>
      <EventLoadStatus
        isLoading={eventQuery.isFetching}
        error={eventQuery.error instanceof Error ? eventQuery.error : null}
        event={data.loadedEvent}
      />
    </FieldGroup>
  );
}
