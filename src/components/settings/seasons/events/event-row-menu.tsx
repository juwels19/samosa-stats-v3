"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { EllipsisIcon, PencilIcon, RefreshCwIcon, ShuffleIcon } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { canEditPickSettingsForEvent } from "@/components/events/can-edit-pick-settings-for-event";

export default function EventRowMenu({
  event,
  isPending,
  onEdit,
  onRefreshTeams,
  onRandomPick,
}: {
  event: Doc<"events">;
  isPending: boolean;
  onEdit: () => void;
  onRefreshTeams: () => void;
  onRandomPick: () => void;
}) {
  const editable = canEditPickSettingsForEvent(event.status);

  return (
    <Dropdown>
      <Button
        isIconOnly
        variant="ghost"
        className="size-11"
        aria-label={`Actions for ${event.displayName}`}
        isPending={isPending}
      >
        <EllipsisIcon className="size-5" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-44">
        <Dropdown.Menu
          aria-label={`Actions for ${event.displayName}`}
          disabledKeys={editable ? [] : ["edit", "refresh"]}
          onAction={(key) => {
            if (key === "edit") onEdit();
            if (key === "refresh") onRefreshTeams();
            if (key === "random") onRandomPick();
          }}
        >
          <Dropdown.Item id="edit" textValue="Edit">
            <PencilIcon className="size-4 shrink-0 text-muted" aria-hidden />
            <Label>Edit</Label>
          </Dropdown.Item>
          <Dropdown.Item id="refresh" textValue="Refresh teams">
            <RefreshCwIcon className="size-4 shrink-0 text-muted" aria-hidden />
            <Label>Refresh teams</Label>
          </Dropdown.Item>
          <Dropdown.Item id="random" textValue="Random pick">
            <ShuffleIcon className="size-4 shrink-0 text-muted" aria-hidden />
            <Label>Random pick</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
