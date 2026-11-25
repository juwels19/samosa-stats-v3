"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CheckIcon, EllipsisIcon } from "lucide-react";

import type { UserRole } from "../../../../convex/lib/roles";
import { ROLE_OPTIONS } from "./constants";

/** Row menu to change a user's role. The current role is checked and disabled. */
export default function UserRoleMenu({
  name,
  role,
  isDisabled,
  isPending,
  onChoose,
}: {
  name: string;
  role: UserRole;
  isDisabled: boolean;
  isPending: boolean;
  onChoose: (role: UserRole) => void;
}) {
  const label = `Actions for ${name}`;
  return (
    <Dropdown>
      <Button
        isIconOnly
        variant="ghost"
        className="size-11 sm:size-9"
        aria-label={label}
        isPending={isPending}
        isDisabled={isDisabled}
      >
        <EllipsisIcon className="size-5" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-56">
        <Dropdown.Menu
          aria-label={label}
          disabledKeys={[role]}
          onAction={(key) => {
            const option = ROLE_OPTIONS.find((item) => item.value === key);
            if (option) onChoose(option.value);
          }}
        >
          {ROLE_OPTIONS.map((option) => {
            const isCurrent = option.value === role;
            return (
              <Dropdown.Item
                key={option.value}
                id={option.value}
                textValue={isCurrent ? option.label : `Make ${option.label.toLowerCase()}`}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {isCurrent ? <CheckIcon className="size-4" aria-hidden /> : null}
                </span>
                <div className="flex flex-col">
                  <Label>{isCurrent ? option.label : `Make ${option.label.toLowerCase()}`}</Label>
                  <span className="text-xs text-muted">{option.description}</span>
                </div>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
