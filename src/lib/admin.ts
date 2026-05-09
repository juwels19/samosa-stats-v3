import "server-only";

import { api } from "../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { clientEnv } from "@/env/client";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export async function requireAdmin() {
  const convex = await getAuthenticatedConvexClient();
  const currentUser = await convex.query(api.users.current, {});

  if (!currentUser?.isAdmin) {
    notFound();
  }

  return currentUser;
}

export async function requireApprovedUser() {
  const convex = await getAuthenticatedConvexClient();
  const currentUser = await convex.query(api.users.current, {});

  if (!currentUser?.isApproved && !currentUser?.isAdmin) {
    redirect(`${ROUTES.WAITLIST}?status=pending`);
  }

  return currentUser;
}

export async function getCurrentUserFromSession() {
  const { getToken, userId } = await auth();

  if (!userId) {
    return null;
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return null;
  }

  const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);

  return await convex.query(api.users.current, {});
}

export async function getAuthenticatedConvexClient() {
  const { getToken, userId } = await auth();

  if (!userId) {
    redirect(ROUTES.SIGN_IN);
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    notFound();
  }

  const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);

  return convex;
}
