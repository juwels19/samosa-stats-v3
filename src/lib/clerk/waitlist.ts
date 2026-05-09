import "server-only";

import type { SerializedWaitlistEntry } from "@/lib/clerk/types";
import type { WaitlistEntry } from "@clerk/backend";
import { clerkClient } from "@clerk/nextjs/server";

export async function getWaitlistEntries(): Promise<SerializedWaitlistEntry[]> {
  const clerk = await clerkClient();
  const pageSize = 100;
  const firstPage = await clerk.waitlistEntries.list({
    limit: pageSize,
    offset: 0,
    orderBy: "-created_at",
  });
  const entries = [...firstPage.data];

  for (
    let offset = entries.length;
    offset < firstPage.totalCount;
    offset += pageSize
  ) {
    const page = await clerk.waitlistEntries.list({
      limit: pageSize,
      offset,
      orderBy: "-created_at",
    });
    entries.push(...page.data);
  }

  return entries.map(serializeWaitlistEntry);
}

function serializeWaitlistEntry(
  entry: WaitlistEntry
): SerializedWaitlistEntry {
  return {
    id: entry.id,
    emailAddress: entry.emailAddress,
    status: entry.status,
    invitation: entry.invitation
      ? {
          status: entry.invitation.status,
        }
      : null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    isLocked: entry.isLocked,
  };
}
