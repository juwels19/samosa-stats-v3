import {
  inviteWaitlistEntry,
  revokeWaitlistEntry,
} from "@/lib/actions/approvals";
import WaitlistEntriesCard from "@/components/approvals/components/waitlist-entries-card";
import { requireApprover } from "@/lib/admin";
import { getWaitlistEntries } from "@/lib/clerk/waitlist";

export const metadata = {
  title: "Approvals",
  description: "Review and manage Samosa Stats waitlist approvals",
};

export default async function ApprovalsPage() {
  await requireApprover();

  const entries = await getWaitlistEntries();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Approvals</h1>
      </div>
      <WaitlistEntriesCard
        entries={entries}
        inviteAction={inviteWaitlistEntry}
        revokeAction={revokeWaitlistEntry}
      />
    </div>
  );
}
