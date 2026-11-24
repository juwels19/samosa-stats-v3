import BackLink from "@/components/common/back-link";
import EventScoring from "@/components/scores/event-scoring";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "Event Scores",
  description: "Category winners and values for an event",
};

export default async function EventScoresPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <div className="flex flex-col gap-2">
      <BackLink href={ROUTES.SCORES} label="Scores" />
      <EventScoring eventId={eventId} />
    </div>
  );
}
