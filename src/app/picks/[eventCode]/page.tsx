export const metadata = {
  title: "Submit Picks",
  description: "Submit your picks for the event",
};

export default async function SubmitPicksPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  return <div>PicksPage</div>;
}
