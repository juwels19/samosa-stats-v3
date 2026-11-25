"use client";

import { Button, Chip, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../../convex/_generated/api";
import Section from "./section";
import { errorMessage, type DiscordMessage, type MocksOverview } from "./types";

const STATUS: Record<DiscordMessage["status"], { label: string; color: "success" | "danger" }> = {
  sent: { label: "Sent", color: "success" },
  failed: { label: "Failed", color: "danger" },
};

/** The latest Discord messages from real and mock events. */
export default function DiscordLogSection({ data }: { data: MocksOverview }) {
  const clearLog = useMutation(api.mocks.clearDiscordLog);
  const [isClearing, setIsClearing] = useState(false);

  const clear = async () => {
    setIsClearing(true);
    try {
      await clearLog({});
    } catch (error) {
      toast.danger("Log not cleared", { description: errorMessage(error) });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Section
      title="Discord log"
      description="The latest 30 messages from status changes and reminders, and whether each one was sent."
      action={
        <Button
          variant="tertiary"
          className="w-full sm:w-auto"
          isDisabled={data.messages.length === 0}
          isPending={isClearing}
          onPress={() => void clear()}
        >
          <Trash2Icon className="size-4" aria-hidden />
          Clear log
        </Button>
      }
    >
      {data.messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          No messages yet. Run a mock event step to see one here.
        </p>
      ) : (
        <ul className="divide-y divide-separator overflow-hidden rounded-2xl border border-border bg-surface">
          {data.messages.map((message) => (
            <li key={message._id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="tabular-nums">{format(message._creationTime, "MMM d, h:mm:ss a")}</span>
                <span aria-hidden>·</span>
                <span className="font-medium text-foreground">{message.eventName}</span>
                {message.isMock ? (
                  <Chip size="sm" variant="soft">
                    Mock
                  </Chip>
                ) : null}
                <Chip size="sm" variant="soft" color={STATUS[message.status].color}>
                  {STATUS[message.status].label}
                </Chip>
              </div>
              <p className="text-sm break-words">{message.content}</p>
              {message.title ? (
                <div className="flex flex-col gap-1 border-l-4 border-[#6061ff] pl-3">
                  <p className="text-sm font-semibold break-words">{message.title}</p>
                  <p className="text-sm whitespace-pre-line break-words text-muted">
                    {message.description}
                  </p>
                </div>
              ) : null}
              {message.error ? <p className="text-xs text-danger">{message.error}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
