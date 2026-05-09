"use server";

import { requireAdmin } from "@/lib/admin";
import { ROUTES } from "@/lib/routes";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function getEntryId(formData: FormData) {
  const entryId = formData.get("entryId");

  if (typeof entryId !== "string" || entryId.length === 0) {
    throw new Error("A waitlist entry ID is required.");
  }

  return entryId;
}

export async function inviteWaitlistEntry(formData: FormData) {
  await requireAdmin();

  const clerk = await clerkClient();
  await clerk.waitlistEntries.invite(getEntryId(formData), {
    ignoreExisting: true,
  });

  revalidatePath(ROUTES.APPROVALS);
}

export async function revokeWaitlistEntry(formData: FormData) {
  await requireAdmin();

  const clerk = await clerkClient();
  await clerk.waitlistEntries.reject(getEntryId(formData));

  revalidatePath(ROUTES.APPROVALS);
}
