import "server-only";

import { api } from "../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { clientEnv } from "@/env/client";
import { notFound } from "next/navigation";

export async function requireAdmin() {
  const { getToken, redirectToSignIn, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    notFound();
  }

  const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);

  const currentUser = await convex.query(api.users.current, {});
  if (!currentUser?.isAdmin) {
    notFound();
  }

  return currentUser;
}
