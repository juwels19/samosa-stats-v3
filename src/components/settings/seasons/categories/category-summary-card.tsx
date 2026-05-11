export default function CategorySummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-2xl font-semibold">{value}</div>
    </div>
  );
}
