"use server";

import { requireAdmin } from "@/lib/admin";
import { ROUTES } from "@/lib/routes";
import { clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { revalidatePath } from "next/cache";
import { api } from "../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { clientEnv } from "@/env/client";

function getEntryData(formData: FormData) {
  const entryId = formData.get("entryId");
  const email = formData.get("email");

  if (typeof entryId !== "string" || entryId.length === 0) {
    throw new Error("A waitlist entry ID is required.");
  }

  if (typeof email !== "string" || email.length === 0) {
    throw new Error("A waitlist email is required.");
  }

  return { entryId, email };
}

export async function inviteWaitlistEntry(formData: FormData) {
  await requireAdmin();
  const { entryId, email } = getEntryData(formData);

  const clerk = await clerkClient();
  await clerk.waitlistEntries.invite(entryId, {
    ignoreExisting: true,
  });
  await updateWaitlistApproval({
    entryId,
    email,
    status: "invited",
  });

  revalidatePath(ROUTES.APPROVALS);
}

export async function revokeWaitlistEntry(formData: FormData) {
  await requireAdmin();
  const { entryId, email } = getEntryData(formData);

  const clerk = await clerkClient();
  await clerk.waitlistEntries.reject(entryId);
  await updateWaitlistApproval({
    entryId,
    email,
    status: "rejected",
  });

  revalidatePath(ROUTES.APPROVALS);
}

async function updateWaitlistApproval({
  entryId,
  email,
  status,
}: {
  entryId: string;
  email: string;
  status: "invited" | "rejected";
}) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });

  if (!token) {
    throw new Error("Could not authenticate approval update.");
  }

  const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);

  await convex.mutation(api.users.setWaitlistApproval, {
    waitlistEntryId: entryId,
    email,
    status,
  });
}
