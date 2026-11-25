export type CategoryValue = {
  /** Number of submissions that picked the category. Every submission has a global category. */
  picks: number;
  /** `picks + 1` for a chosen category. The event's calculated value for a global category. */
  baseValue: number;
  /** Points the category gives for each winning picked team. */
  value: number;
  isTop: boolean;
  isGlobal: boolean;
};

export type CategoryValues<CategoryId extends string> = {
  values: Map<CategoryId, CategoryValue>;
  /** Highest `baseValue` of the chosen categories. The award deduction uses this value. */
  topCatValue: number;
  topCategoryIds: CategoryId[];
};

/**
 * Calculates the value of each category offered at an event.
 * See "Category value" and "Global categories" in docs/scoring.md.
 *
 * Global categories apply to every submission. Players don't choose them, so
 * they don't count as picks, are never top categories and don't change
 * `topCatValue`. Each gives a value calculated for the event, rounded down
 * (0 while it has none).
 */
export function getCategoryValues<CategoryId extends string>({
  categoryIds,
  submissions,
  globalPoints = new Map(),
}: {
  /** All categories offered at the event, global ones included. */
  categoryIds: readonly CategoryId[];
  submissions: readonly { categoryIds: readonly CategoryId[] }[];
  /** Each global category's value at this event, before rounding. Null when it has none yet. */
  globalPoints?: ReadonlyMap<CategoryId, number | null>;
}): CategoryValues<CategoryId> {
  const chosenIds = categoryIds.filter((categoryId) => !globalPoints.has(categoryId));
  const offered = new Set(categoryIds);
  const picks = new Map<CategoryId, number>(chosenIds.map((categoryId) => [categoryId, 0]));

  for (const submission of submissions) {
    for (const categoryId of new Set(submission.categoryIds)) {
      if (!offered.has(categoryId)) {
        throw new Error(
          `Submission picked category ${categoryId}, which the event does not offer.`,
        );
      }
      const count = picks.get(categoryId);
      // Picks store the global categories too. They are not choices.
      if (count !== undefined) picks.set(categoryId, count + 1);
    }
  }

  const topCatValue = chosenIds.length === 0 ? 0 : Math.max(...picks.values()) + 1;
  const topCategoryIds = chosenIds.filter(
    (categoryId) => picks.get(categoryId)! + 1 === topCatValue,
  );
  const topCount = topCategoryIds.length;

  const values = new Map<CategoryId, CategoryValue>();
  for (const categoryId of categoryIds) {
    if (globalPoints.has(categoryId)) {
      // Rounded down, the same as tied top categories.
      const points = Math.floor(globalPoints.get(categoryId) ?? 0);
      values.set(categoryId, {
        picks: submissions.length,
        baseValue: points,
        value: points,
        isTop: false,
        isGlobal: true,
      });
      continue;
    }
    const categoryPicks = picks.get(categoryId)!;
    const baseValue = categoryPicks + 1;
    const isTop = baseValue === topCatValue;
    const value = !isTop ? baseValue : topCount === 1 ? 0 : Math.floor(baseValue / topCount);

    values.set(categoryId, { picks: categoryPicks, baseValue, value, isTop, isGlobal: false });
  }

  return { values, topCatValue, topCategoryIds };
}
