import type { UserRole } from "../../../../convex/lib/roles";

export const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full access, including settings." },
  { value: "approver", label: "Approver", description: "Can approve waitlist users." },
  { value: "player", label: "Player", description: "Makes picks. No admin pages." },
];

export type RoleFilter = "all" | UserRole;

export const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "admin", label: "Admins" },
  { id: "approver", label: "Approvers" },
  { id: "player", label: "Players" },
];

export function roleLabel(role: UserRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
