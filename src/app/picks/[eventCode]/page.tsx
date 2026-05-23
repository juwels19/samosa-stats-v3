import SubmitPicks from "@/components/picks/submit-picks";
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

  return <SubmitPicks eventCode={eventCode} />;
}
