type GroupableCategory = {
  text: string;
  winnerSource?: { type: "manual" | "config" | "script" | "leastUnique" };
};

/** Splits categories by winner source, each group sorted by name. */
export function groupScoringCategories<Category extends GroupableCategory>(
  categories: readonly Category[],
) {
  const sorted = categories.toSorted((a, b) => a.text.localeCompare(b.text));
  return {
    // Found by code: Calculate winners runs configs and scripts, and least
    // unique comes from the picks.
    automatic: sorted.filter(
      (c) => c.winnerSource !== undefined && c.winnerSource.type !== "manual",
    ),
    manual: sorted.filter((c) => c.winnerSource?.type === "manual"),
    notSetUp: sorted.filter((c) => c.winnerSource === undefined),
  };
}

/** The latest calculation time across automatic categories, if any. */
export function getLastCalculatedAt(
  categories: readonly {
    result:
      | { type: "config" | "error" | "script"; calculatedAt: number }
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
