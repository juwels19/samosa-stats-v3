"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { adminMenuItems, generalMenuItems } from "./constants";

export function useNavItems() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(
    api.users.current,
    isAuthenticated ? {} : "skip",
  );
  const isAdmin = isAuthenticated && (currentUser?.isAdmin ?? false);

  return {
    isAuthenticated,
    items: isAdmin ? [...generalMenuItems, ...adminMenuItems] : generalMenuItems,
  };
}
