import ScoresEventList from "@/components/scores/scores-event-list";

export const metadata = {
  title: "Scores",
  description: "Category winners and scores for each event",
};

export default function ScoresPage() {
  return <ScoresEventList />;
}
