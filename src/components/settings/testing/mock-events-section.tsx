"use client";

import { Button, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { CopyPlusIcon } from "lucide-react";
import { useState } from "react";

import OptionSelect from "@/components/settings/seasons/categories/scoring/option-select";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import CountField from "./count-field";
import MockEventCard from "./mock-event-card";
import Section from "./section";
import { errorMessage, type MocksOverview } from "./types";

const INTERVAL = { min: 1, max: 60 };

/**
 * Copies a real event as a mock event that goes through each status a few
 * minutes apart, with the same actions and Discord messages as a real event.
 */
export default function MockEventsSection({ data }: { data: MocksOverview }) {
  const createMockEvent = useMutation(api.mocks.createMockEvent);
  const realEvents = data.events.filter((event) => event.mock === undefined);
  const mockEvents = data.events.filter((event) => event.mock !== undefined);
  const [sourceId, setSourceId] = useState<Id<"events"> | null>(null);
  const [interval, setIntervalMinutes] = useState(2);
  const [isCreating, setIsCreating] = useState(false);

  const source = realEvents.find((event) => event._id === sourceId) ?? realEvents[0];

  const create = async () => {
    if (source === undefined) return;
    setIsCreating(true);
    try {
      await createMockEvent({ sourceEventId: source._id, intervalMinutes: interval });
      toast.success("Mock event created", {
        description: `Submissions open in ${interval} ${interval === 1 ? "minute" : "minutes"}.`,
      });
    } catch (error) {
      toast.danger("Mock event not created", { description: errorMessage(error) });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Section
      title="Mock events"
      description="A mock event copies the teams, categories and pick settings of a real event. Team refresh and scoring use the real event's data."
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        {realEvents.length === 0 ? (
          <p className="text-sm text-muted">The active season has no events to copy.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
              <OptionSelect
                label="Copy event"
                value={source?._id ?? ""}
                options={realEvents.map((event) => ({
                  value: event._id,
                  label: event.displayName,
                  description: `${event.eventCode} · ${event.teamCount} teams`,
                }))}
                onChange={(value) =>
                  setSourceId(realEvents.find((event) => event._id === value)?._id ?? null)
                }
              />
              <CountField
                label="Minutes per step"
                value={interval}
                min={INTERVAL.min}
                max={INTERVAL.max}
                onChange={setIntervalMinutes}
              />
            </div>
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted">
                Open, reminder, close, start and complete run {interval}{" "}
                {interval === 1 ? "minute" : "minutes"} apart.
              </p>
              <Button
                isDisabled={source === undefined}
                isPending={isCreating}
                onPress={() => void create()}
              >
                <CopyPlusIcon className="size-4" aria-hidden />
                Create mock event
              </Button>
            </div>
          </>
        )}
      </div>

      {mockEvents.length === 0 ? null : (
        <ul className="flex flex-col gap-4">
          {mockEvents.map((event) => (
            <li key={event._id}>
              <MockEventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
