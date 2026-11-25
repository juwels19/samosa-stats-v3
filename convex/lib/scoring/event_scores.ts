import { getCategoryValues } from "./category_values";

/**
 * Event scores for all submissions at an event. See "Event score" in
 * docs/scoring.md. Pure, so the live preview and the final snapshot use the
 * same rules.
 */

export type ScoreLineItem<CategoryId extends string> =
  | { type: "category"; category: CategoryId; team: number; amount: number }
  | { type: "award"; team: number; amount: number }
  | { type: "leastUnique"; amount: number };

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
  /** The submissions that got the least unique deduction. */
  leastUnique: SubmissionId[];
};

export function calculateEventScores<SubmissionId extends string, CategoryId extends string>({
  categoryIds,
  submissions,
  winners,
  awardWinners,
}: {
  /** All categories offered at the event. */
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
}): EventScores<SubmissionId, CategoryId> {
  const { values, topCatValue } = getCategoryValues({ categoryIds, submissions });

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

    for (const category of new Set(submission.categoryIds)) {
      const categoryWinners = new Set(winners.get(category) ?? []);
      const amount = values.get(category)?.value ?? 0;
      for (const team of teams) {
        if (categoryWinners.has(team)) {
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

  return {
    scores: scores.map(({ submission, uniqueness, lineItems }) => {
      const items = leastUniqueSet.has(submission)
        ? [...lineItems, { type: "leastUnique" as const, amount: -topTeamValue }]
        : lineItems;
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

/**
 * The submission with the highest uniqueness. Ties go to the submission whose
 * team pick counts, sorted high to low, are higher at the first difference.
 * Submissions still tied all get the deduction.
 */
export function findLeastUnique<SubmissionId extends string>(
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
