type GroupableCategory = {
  text: string;
  winnerSource?: { type: "manual" } | { type: "config" };
};

/** Splits categories by winner source, each group sorted by name. */
export function groupScoringCategories<Category extends GroupableCategory>(
  categories: readonly Category[],
) {
  const sorted = categories.toSorted((a, b) => a.text.localeCompare(b.text));
  return {
    automatic: sorted.filter((c) => c.winnerSource?.type === "config"),
    manual: sorted.filter((c) => c.winnerSource?.type === "manual"),
    notSetUp: sorted.filter((c) => c.winnerSource === undefined),
  };
}

/** The latest calculation time across automatic categories, if any. */
export function getLastCalculatedAt(
  categories: readonly {
    result:
      | { type: "config" | "error"; calculatedAt: number }
      | { type: "manual" }
      | null;
  }[],
): number | null {
  let latest: number | null = null;
  for (const { result } of categories) {
    if (result !== null && result.type !== "manual") {
      latest = Math.max(latest ?? 0, result.calculatedAt);
    }
  }
  return latest;
}
