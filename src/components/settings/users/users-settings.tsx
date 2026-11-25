"use client";

import {
  AlertDialog,
  Button,
  Chip,
  SearchField,
  Skeleton,
  Table,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { UserRole } from "../../../../convex/lib/roles";
import { ROLE_FILTERS, roleLabel, type RoleFilter } from "./constants";
import RoleChip from "./role-chip";
import UserRoleMenu from "./user-role-menu";

type UserRow = {
  _id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isCurrentUser: boolean;
  joinedAt: number;
};

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Admin page to give each user a role. Admin changes ask to confirm; other changes save at once. */
export default function UsersSettings() {
  const currentUser = useCurrentUser();
  // Wait for sign-in, or the admin check fails before the user loads.
  const users = useQuery(api.users.listWithRoles, currentUser.user?.isAdmin ? {} : "skip");
  const setRoleMutation = useMutation(api.users.setRole);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [pendingId, setPendingId] = useState<Id<"users"> | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState<UserRow | null>(null);

  const setRole = async (user: UserRow, role: UserRole) => {
    setPendingId(user._id);
    try {
      await setRoleMutation({ userId: user._id, role });
      toast.success(`${displayName(user)} is now ${role === "player" ? "a" : "an"} ${roleLabel(role).toLowerCase()}`);
    } catch (error) {
      toast.danger("Role not changed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPendingId(null);
    }
  };

  const choose = (user: UserRow, role: UserRole) => {
    if (role === user.role) return;
    if (role === "admin") setConfirmAdmin(user);
    else void setRole(user, role);
  };

  const visible = (users ?? []).filter(
    (user) => matchesQuery(user, query) && (filter === "all" || user.role === filter),
  );

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="Users"
        description="Give each user a role. Approvers can approve waitlist users but can't change settings."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField aria-label="Search users" value={query} onChange={setQuery} className="sm:w-72">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search name or email" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <ToggleButtonGroup
          aria-label="Filter by role"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[filter]}
          onSelectionChange={(keys) => {
            const [next] = keys;
            const match = ROLE_FILTERS.find((item) => item.id === next);
            if (match) setFilter(match.id);
          }}
          className="w-full sm:ml-auto sm:w-auto"
          fullWidth
        >
          {ROLE_FILTERS.map((item, index) => (
            <ToggleButton key={item.id} id={item.id} className="min-h-11 sm:min-h-9">
              {index > 0 ? <ToggleButtonGroup.Separator /> : null}
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {users === undefined ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
          {users.length === 0 ? "There are no users yet." : "No users match."}
        </p>
      ) : (
        <>
          {/* Phones: one card for each user. */}
          <ul className="grid gap-3 sm:hidden">
            {visible.map((user) => (
              <li key={user._id} className="flex items-center gap-3 rounded-2xl bg-surface p-4">
                <UserCell user={user} />
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <RoleChip role={user.role} />
                  <UserRoleMenu
                    name={displayName(user)}
                    role={user.role}
                    isDisabled={!canChangeRole(user)}
                    isPending={pendingId === user._id}
                    onChoose={(role) => choose(user, role)}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Users" className="min-w-[640px]">
                  <Table.Header>
                    <Table.Column isRowHeader>User</Table.Column>
                    <Table.Column>Status</Table.Column>
                    <Table.Column>Joined</Table.Column>
                    <Table.Column>Role</Table.Column>
                    <Table.Column className="text-right">
                      <span className="sr-only">Actions</span>
                    </Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {visible.map((user) => (
                      <Table.Row key={user._id}>
                        <Table.Cell>
                          <UserCell user={user} />
                        </Table.Cell>
                        <Table.Cell>
                          {isApprovedOrAdmin(user) ? (
                            <span className="text-sm text-muted">Approved</span>
                          ) : (
                            <Chip size="sm" variant="soft" color="warning">
                              Not approved
                            </Chip>
                          )}
                        </Table.Cell>
                        <Table.Cell className="text-sm whitespace-nowrap text-muted tabular-nums">
                          {dateFormat.format(user.joinedAt)}
                        </Table.Cell>
                        <Table.Cell>
                          <RoleChip role={user.role} />
                        </Table.Cell>
                        <Table.Cell className="text-right">
                          <UserRoleMenu
                            name={displayName(user)}
                            role={user.role}
                            isDisabled={!canChangeRole(user)}
                            isPending={pendingId === user._id}
                            onChoose={(role) => choose(user, role)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>

          <p className="text-sm text-muted tabular-nums">
            {visible.length} of {users.length} users
          </p>
        </>
      )}

      <AlertDialog.Backdrop
        isOpen={confirmAdmin !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAdmin(null);
        }}
      >
        <AlertDialog.Container placement="auto">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>
                Make {confirmAdmin ? displayName(confirmAdmin) : ""} an admin?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-muted">
                Admins can change settings, scores and every user&apos;s role, including yours.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                slot="close"
                onPress={() => {
                  if (confirmAdmin) void setRole(confirmAdmin, "admin");
                }}
              >
                Make admin
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}

function UserCell({ user }: { user: UserRow }) {
  const name = fullName(user);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-default text-xs font-semibold"
      >
        {initials(user)}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 font-medium">
          <span className="truncate">{name || user.email}</span>
          {user.isCurrentUser ? <span className="shrink-0 text-xs text-muted">(you)</span> : null}
        </span>
        {name ? <span className="truncate text-sm text-muted">{user.email}</span> : null}
      </div>
    </div>
  );
}

function fullName(user: UserRow) {
  return `${user.firstName} ${user.lastName}`.trim();
}

function displayName(user: UserRow) {
  return fullName(user) || user.email;
}

function initials(user: UserRow) {
  const letters = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  return (letters || user.email[0] || "?").toUpperCase();
}

function isApprovedOrAdmin(user: UserRow) {
  return user.isApproved || user.role === "admin";
}

/** Same rules as the setRole mutation. */
function canChangeRole(user: UserRow) {
  return !user.isCurrentUser && isApprovedOrAdmin(user);
}

function matchesQuery(user: UserRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return displayName(user).toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
}
