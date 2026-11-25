"use client";

import { Button, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import OptionSelect from "@/components/settings/seasons/categories/scoring/option-select";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import CountField from "./count-field";
import Section from "./section";
import { errorMessage, type MocksOverview } from "./types";

const MAX_PICKS = 50;

/** Adds random picks from mock players to any event, and clears them. */
export default function MockPicksSection({ data }: { data: MocksOverview }) {
  const addMockPicks = useMutation(api.mocks.addMockPicks);
  const clearMockPicks = useMutation(api.mocks.clearMockPicks);
  const [selectedId, setSelectedId] = useState<Id<"events"> | null>(null);
  const [count, setCount] = useState(10);
  const [pending, setPending] = useState<"add" | "clear" | null>(null);

  const event = data.events.find((item) => item._id === selectedId) ?? data.events[0];
  const disabled = event === undefined;

  const run = async (kind: "add" | "clear") => {
    if (event === undefined) return;
    setPending(kind);
    try {
      if (kind === "add") {
        const result = await addMockPicks({ eventId: event._id, count });
        toast.success(`${result.added} mock picks added`, { description: event.displayName });
      } else {
        const result = await clearMockPicks({ eventId: event._id });
        toast.success(`${result.removed} mock picks removed`, { description: event.displayName });
      }
    } catch (error) {
      toast.danger(kind === "add" ? "Mock picks not added" : "Mock picks not removed", {
        description: errorMessage(error),
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <Section
      title="Mock picks"
      description={`Mock players make random picks, like real players. ${data.mockPlayerCount} mock players exist.`}
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        {data.events.length === 0 ? (
          <p className="text-sm text-muted">The active season has no events.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
              <OptionSelect
                label="Event"
                value={event?._id ?? ""}
                options={data.events.map((item) => ({
                  value: item._id,
                  label: item.displayName,
                  description: `${item.eventCode} · ${item.pickCount} picks, ${item.mockPickCount} mock · ${item.teamCount} teams`,
                }))}
                onChange={(value) =>
                  setSelectedId(data.events.find((item) => item._id === value)?._id ?? null)
                }
              />
              <CountField label="Picks to add" value={count} min={1} max={MAX_PICKS} onChange={setCount} />
            </div>
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted tabular-nums">
                {event
                  ? `${event.pickCount} picks at ${event.eventCode}. ${event.mockPickCount} are mock picks.`
                  : null}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  variant="tertiary"
                  isDisabled={disabled || event.mockPickCount === 0}
                  isPending={pending === "clear"}
                  onPress={() => void run("clear")}
                >
                  <Trash2Icon className="size-4" aria-hidden />
                  Clear mock picks
                </Button>
                <Button isDisabled={disabled} isPending={pending === "add"} onPress={() => void run("add")}>
                  <PlusIcon className="size-4" aria-hidden />
                  Add picks
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
