"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
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
import EventPickCountsFields from "./event-pick-counts-fields";
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

  const eventCodeError = shouldShowValidation
    ? fieldErrors.eventCode?.[0]
    : undefined;
  const displayNameError = shouldShowValidation
    ? fieldErrors.displayName?.[0]
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="create-event-code"
          fullWidth
          value={data.eventCode}
          onChange={(value) =>
            updateData({
              eventCode: value,
              loadedEvent: null,
            })
          }
          isInvalid={Boolean(eventCodeError)}
        >
          <Label>Event code</Label>
          <Input
            placeholder="For example, onnew"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <Description>Enter the event code without the year.</Description>
          {eventCodeError ? <FieldError>{eventCodeError}</FieldError> : null}
        </TextField>
        <TextField
          id="create-event-display-name"
          fullWidth
          value={data.displayName}
          onChange={(value) => updateData({ displayName: value })}
          isInvalid={Boolean(displayNameError)}
        >
          <Label>Display name</Label>
          <Input placeholder="Enter a display name" autoComplete="off" />
          {displayNameError ? (
            <FieldError>{displayNameError}</FieldError>
          ) : null}
        </TextField>
      </div>
      <EventLoadStatus
        isLoading={eventQuery.isFetching}
        error={eventQuery.error instanceof Error ? eventQuery.error : null}
        event={data.loadedEvent}
      />
      <EventPickCountsFields
        numberOfTeamPicks={data.numberOfTeamPicks}
        numberOfCategoryPicks={data.numberOfCategoryPicks}
        onNumberOfTeamPicksChange={(value) =>
          updateData({ numberOfTeamPicks: value })
        }
        onNumberOfCategoryPicksChange={(value) =>
          updateData({ numberOfCategoryPicks: value })
        }
        showValidation={shouldShowValidation}
        teamPicksError={fieldErrors.numberOfTeamPicks?.[0]}
        categoryPicksError={fieldErrors.numberOfCategoryPicks?.[0]}
        idPrefix="create-event"
      />
    </div>
  );
}
