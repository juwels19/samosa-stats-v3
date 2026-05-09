import {
  inviteWaitlistEntry,
  revokeWaitlistEntry,
} from "@/lib/actions/approvals";
import WaitlistEntriesCard from "@/components/approvals/components/waitlist-entries-card";
import { requireAdmin } from "@/lib/admin";
import { getWaitlistEntries } from "@/lib/clerk/waitlist";

export const metadata = {
  title: "Approvals",
  description: "Review and manage Samosa Stats waitlist approvals",
};

export default async function ApprovalsPage() {
  await requireAdmin();

  const entries = await getWaitlistEntries();

  return (
    <div className="flex flex-col gap-6 px-6 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Approvals</h1>
      </div>

      <WaitlistEntriesCard
        entries={entries}
        inviteAction={inviteWaitlistEntry}
        revokeAction={revokeWaitlistEntry}
      />
    </div>
  );
}
