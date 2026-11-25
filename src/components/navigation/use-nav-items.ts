"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { canApproveUsers } from "../../../convex/lib/roles";
import { adminMenuItems, approvalsMenuItem, generalMenuItems } from "./constants";

export function useNavItems() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.users.current,
    isAuthenticated ? {} : "skip",
  );
  const isAdmin = isAuthenticated && (currentUser?.isAdmin ?? false);
  const canApprove = isAuthenticated && canApproveUsers(currentUser);

  return {
    isAuthenticated,
    items: [
      ...generalMenuItems,
      ...(canApprove ? [approvalsMenuItem] : []),
      ...(isAdmin ? adminMenuItems : []),
    ],
  };
}
