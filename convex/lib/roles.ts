/** A user's role. Admins can do everything approvers can. */
export const USER_ROLES = ["player", "approver", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

type RoleFields = { isAdmin: boolean; isApprover: boolean; isApproved: boolean };

export function getUserRole(user: Pick<RoleFields, "isAdmin" | "isApprover">): UserRole {
  if (user.isAdmin) return "admin";
  if (user.isApprover) return "approver";
  return "player";
}

/** The flags to save for a role. */
export function getRoleFlags(role: UserRole): Pick<RoleFields, "isAdmin" | "isApprover"> {
  return { isAdmin: role === "admin", isApprover: role === "approver" };
}

/** Admins, and approvers who are still approved, can approve waitlist users. */
export function canApproveUsers(user: RoleFields | null | undefined): boolean {
  if (!user) return false;
  return user.isAdmin || (user.isApprover && user.isApproved);
}
