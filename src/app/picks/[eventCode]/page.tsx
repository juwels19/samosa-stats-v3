import BackLink from "@/components/common/back-link";
import SubmitPicks from "@/components/picks/submit-picks";
import { ROUTES } from "@/lib/routes";
import { requireApprovedUser } from "@/lib/admin";

export const metadata = {
  title: "Submit Picks",
  description: "Submit your picks for the event",
};

export default async function SubmitPicksPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  await requireApprovedUser();

  const { eventCode } = await params;

  return (
    <>
      <div className="px-4 pt-2 sm:px-6 sm:pt-4">
        <BackLink href={ROUTES.DASHBOARD} label="Dashboard" />
      </div>
      <SubmitPicks eventCode={eventCode} />
    </>
  );
}
