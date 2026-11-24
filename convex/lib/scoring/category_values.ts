export type CategoryValue = {
  /** Number of submissions that picked the category. */
  picks: number;
  /** `picks + 1`. */
  baseValue: number;
  /** Points the category gives for each winning picked team. */
  value: number;
  isTop: boolean;
};

export type CategoryValues<CategoryId extends string> = {
  values: Map<CategoryId, CategoryValue>;
  /** Highest `baseValue` at the event. The award deduction uses this value. */
  topCatValue: number;
  topCategoryIds: CategoryId[];
};

/**
 * Calculates the value of each category offered at an event.
 * See "Category value" in docs/scoring.md.
 */
export function getCategoryValues<CategoryId extends string>({
  categoryIds,
  submissions,
}: {
  /** All categories offered at the event. */
  categoryIds: readonly CategoryId[];
  submissions: readonly { categoryIds: readonly CategoryId[] }[];
}): CategoryValues<CategoryId> {
  const picks = new Map<CategoryId, number>(
    categoryIds.map((categoryId) => [categoryId, 0]),
  );

  for (const submission of submissions) {
    for (const categoryId of new Set(submission.categoryIds)) {
      const count = picks.get(categoryId);
      if (count === undefined) {
        throw new Error(
          `Submission picked category ${categoryId}, which the event does not offer.`,
        );
      }
      picks.set(categoryId, count + 1);
    }
  }

  const topCatValue =
    categoryIds.length === 0 ? 0 : Math.max(...picks.values()) + 1;
  const topCategoryIds = categoryIds.filter(
    (categoryId) => picks.get(categoryId)! + 1 === topCatValue,
  );
  const topCount = topCategoryIds.length;

  const values = new Map<CategoryId, CategoryValue>();
  for (const categoryId of categoryIds) {
    const categoryPicks = picks.get(categoryId)!;
    const baseValue = categoryPicks + 1;
    const isTop = baseValue === topCatValue;
    const value = !isTop
      ? baseValue
      : topCount === 1
        ? 0
        : Math.floor(baseValue / topCount);

    values.set(categoryId, { picks: categoryPicks, baseValue, value, isTop });
  }

  return { values, topCatValue, topCategoryIds };
}
