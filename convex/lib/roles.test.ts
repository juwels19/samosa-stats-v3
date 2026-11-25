import { describe, expect, it } from "vitest";

import { canApproveUsers, getRoleFlags, getUserRole, USER_ROLES } from "./roles";

const player = { isAdmin: false, isApprover: false, isApproved: true };

describe("getUserRole", () => {
  it("gives admin when the user is an admin", () => {
    expect(getUserRole({ isAdmin: true, isApprover: true })).toBe("admin");
  });

  it("gives approver when the user is an approver", () => {
    expect(getUserRole({ isAdmin: false, isApprover: true })).toBe("approver");
  });

  it("gives player when the user has no role flags", () => {
    expect(getUserRole(player)).toBe("player");
  });
});

describe("getRoleFlags", () => {
  it("gives back the same role", () => {
    for (const role of USER_ROLES) {
      expect(getUserRole(getRoleFlags(role))).toBe(role);
    }
  });

  it("clears the approver flag for an admin", () => {
    expect(getRoleFlags("admin")).toEqual({ isAdmin: true, isApprover: false });
  });
});

describe("canApproveUsers", () => {
  it("allows admins, also when they are not approved", () => {
    expect(canApproveUsers({ ...player, isAdmin: true, isApproved: false })).toBe(true);
  });

  it("allows approved approvers", () => {
    expect(canApproveUsers({ ...player, isApprover: true })).toBe(true);
  });

  it("refuses approvers who are no longer approved", () => {
    expect(canApproveUsers({ ...player, isApprover: true, isApproved: false })).toBe(false);
  });

  it("refuses players and signed-out users", () => {
    expect(canApproveUsers(player)).toBe(false);
    expect(canApproveUsers(null)).toBe(false);
  });
});
