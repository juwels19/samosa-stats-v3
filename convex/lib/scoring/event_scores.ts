import { getCategoryValues } from "./category_values";

/**
 * Event scores for all submissions at an event. See "Event score" in
 * docs/scoring.md. Pure, so the live preview and the final snapshot use the
 * same rules.
 */

export type ScoreLineItem<CategoryId extends string> =
  | { type: "category"; category: CategoryId; team: number; amount: number }
  | { type: "award"; team: number; amount: number }
  /** The submission is the least unique, and `category` uses the least unique rule. */
  | { type: "leastUnique"; category?: CategoryId; amount: number };

export type SubmissionScore<SubmissionId extends string, CategoryId extends string> = {
  submission: SubmissionId;
  total: number;
  /** `uniqueness(p)`: the sum of `picks(t)` for the submission's teams. */
  uniqueness: number;
  lineItems: ScoreLineItem<CategoryId>[];
};

export type EventScores<SubmissionId extends string, CategoryId extends string> = {
  scores: SubmissionScore<SubmissionId, CategoryId>[];
  topCatValue: number;
  topTeamValue: number;
  /** The least unique submissions. Each least unique category gives them its value. */
  leastUnique: SubmissionId[];
};

export function calculateEventScores<SubmissionId extends string, CategoryId extends string>({
  categoryIds,
  submissions,
  winners,
  awardWinners,
  globalPoints = new Map(),
  leastUniqueCategoryIds = [],
  teamPoints = new Map(),
}: {
  /** All categories offered at the event, global ones included. */
  categoryIds: readonly CategoryId[];
  submissions: readonly {
    id: SubmissionId;
    categoryIds: readonly CategoryId[];
    teams: readonly number[];
  }[];
  /** `winners(c)` for each category that has winners. */
  winners: ReadonlyMap<CategoryId, readonly number[]>;
  /** Teams that won the season's deduction award at the event. */
  awardWinners: readonly number[];
  /** Each global category's value at this event. Every submission gets these categories. */
  globalPoints?: ReadonlyMap<CategoryId, number | null>;
  /** Global categories won by the least unique submissions, not by teams. */
  leastUniqueCategoryIds?: readonly CategoryId[];
  /** Global categories whose points an admin sets for each team. A team with no points gives 0. */
  teamPoints?: ReadonlyMap<CategoryId, ReadonlyMap<number, number>>;
}): EventScores<SubmissionId, CategoryId> {
  const { values, topCatValue } = getCategoryValues({ categoryIds, submissions, globalPoints });
  const globalIds = categoryIds.filter((categoryId) => globalPoints.has(categoryId));

  const teamPicks = new Map<number, number>();
  for (const submission of submissions) {
    for (const team of new Set(submission.teams)) {
      teamPicks.set(team, (teamPicks.get(team) ?? 0) + 1);
    }
  }
  const topTeamValue = Math.max(0, ...teamPicks.values());
  const awardTeams = new Set(awardWinners);

  const scores = submissions.map((submission) => {
    const teams = [...new Set(submission.teams)];
    const lineItems: ScoreLineItem<CategoryId>[] = [];

    // Every submission gets the global categories, whether or not the pick stores them.
    for (const category of new Set([...submission.categoryIds, ...globalIds])) {
      const categoryWinners = new Set(winners.get(category) ?? []);
      const value = values.get(category)?.value ?? 0;
      const pointsByTeam = teamPoints.get(category);
      for (const team of teams) {
        if (categoryWinners.has(team)) {
          const amount = pointsByTeam === undefined ? value : (pointsByTeam.get(team) ?? 0);
          lineItems.push({ type: "category", category, team, amount });
        }
      }
    }
    for (const team of teams) {
      if (awardTeams.has(team)) {
        lineItems.push({ type: "award", team, amount: -topCatValue });
      }
    }

    return {
      submission: submission.id,
      uniqueness: teams.reduce((sum, team) => sum + (teamPicks.get(team) ?? 0), 0),
      teamPickCounts: teams.map((team) => teamPicks.get(team) ?? 0),
      lineItems,
    };
  });

  const leastUnique = findLeastUnique(scores);
  const leastUniqueSet = new Set(leastUnique);
  const leastUniqueItems = leastUniqueCategoryIds.map((category) => ({
    type: "leastUnique" as const,
    category,
    amount: values.get(category)?.value ?? 0,
  }));

  return {
    scores: scores.map(({ submission, uniqueness, lineItems }) => {
      const items = leastUniqueSet.has(submission) ? [...lineItems, ...leastUniqueItems] : lineItems;
      return {
        submission,
        uniqueness,
        lineItems: items,
        total: items.reduce((sum, item) => sum + item.amount, 0),
      };
    }),
    topCatValue,
    topTeamValue,
    leastUnique,
  };
}

/** Each submission's uniqueness and team pick counts, for `findLeastUnique`. */
export function getUniqueness<SubmissionId>(
  submissions: readonly { id: SubmissionId; teams: readonly number[] }[],
) {
  const teamPicks = new Map<number, number>();
  for (const submission of submissions) {
    for (const team of new Set(submission.teams)) {
      teamPicks.set(team, (teamPicks.get(team) ?? 0) + 1);
    }
  }
  return submissions.map((submission) => {
    const counts = [...new Set(submission.teams)].map((team) => teamPicks.get(team) ?? 0);
    return {
      submission: submission.id,
      uniqueness: counts.reduce((sum, count) => sum + count, 0),
      teamPickCounts: counts,
    };
  });
}

/**
 * The submission with the highest uniqueness. Ties go to the submission whose
 * team pick counts, sorted high to low, are higher at the first difference.
 * Submissions still tied are all least unique.
 */
export function findLeastUnique<SubmissionId>(
  scores: readonly { submission: SubmissionId; uniqueness: number; teamPickCounts: readonly number[] }[],
): SubmissionId[] {
  let leaders: typeof scores[number][] = [];
  for (const score of scores) {
    const leader = leaders[0];
    const order = leader === undefined ? 1 : compareLeastUnique(score, leader);
    if (order > 0) leaders = [score];
    else if (order === 0) leaders.push(score);
  }
  return leaders.map((score) => score.submission);
}

function compareLeastUnique(
  a: { uniqueness: number; teamPickCounts: readonly number[] },
  b: { uniqueness: number; teamPickCounts: readonly number[] },
) {
  if (a.uniqueness !== b.uniqueness) return a.uniqueness - b.uniqueness;
  const countsA = a.teamPickCounts.toSorted((x, y) => y - x);
  const countsB = b.teamPickCounts.toSorted((x, y) => y - x);
  for (let i = 0; i < Math.max(countsA.length, countsB.length); i++) {
    const difference = (countsA[i] ?? 0) - (countsB[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
