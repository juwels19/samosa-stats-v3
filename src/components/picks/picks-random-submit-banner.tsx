export default function PicksRandomSubmitBanner() {
  return (
    <div
      role="status"
      className="rounded-3xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm"
    >
      <p className="font-medium">Random pick</p>
      <p className="text-muted-foreground">
        This submission will be saved as a random pick.
      </p>
    </div>
  );
}
