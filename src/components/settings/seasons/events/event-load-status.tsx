import { Alert, Spinner } from "@heroui/react";
import { CalendarCheckIcon } from "lucide-react";

import { formatEventDate } from "@/components/events/utils";

type EventLoadStatusProps = {
  isLoading: boolean;
  error: Error | null;
  event: {
    name: string;
    startDate: string;
    endDate: string;
  } | null;
};

export default function EventLoadStatus({
  isLoading,
  error,
  event,
}: EventLoadStatusProps) {
  if (isLoading) {
    return (
      <Alert status="default">
        <Alert.Indicator>
          <Spinner color="current" size="sm" />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Loading event details</Alert.Title>
          <Alert.Description>
            Checking the FRC Events API for a matching event.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (error !== null) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Event could not be loaded</Alert.Title>
          <Alert.Description>{error.message}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (event !== null) {
    return (
      <Alert status="success">
        <Alert.Indicator>
          <CalendarCheckIcon className="size-5" />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>{event.name}</Alert.Title>
          <Alert.Description>
            {formatEventDate(event.startDate)} to{" "}
            {formatEventDate(event.endDate)}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
      Event details show here after you enter a valid event code.
    </p>
  );
}
