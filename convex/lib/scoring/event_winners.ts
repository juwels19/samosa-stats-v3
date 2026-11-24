import {
  findCategoryWinners,
  type ScoringRow,
  type TeamWinnerResult,
} from "./find_category_winners";
import { loadScoringEventData } from "./sources/event_data";
import {
  getRequiredSources,
  winnerConfigSchema,
  type ScoringSource,
} from "./winner_config";

export type EventSourceRows = {
  rows: Partial<Record<ScoringSource, readonly ScoringRow[]>>;
  /** Sources that could not be loaded, with the error message. */
  failures: Map<ScoringSource, string>;
};

export type ConfigCategoryOutcome<CategoryId extends string> =
  | {
      categoryId: CategoryId;
      type: "config";
      winners: number[];
      teams: TeamWinnerResult[];
    }
  | { categoryId: CategoryId; type: "error"; message: string };

/**
 * Gets each source in its own request. A source that fails does not stop
 * the categories that do not read it.
 */
export async function loadEventSourceRows({
  year,
  eventCode,
  teams,
  sources,
}: {
  year: number;
  eventCode: string;
  teams: number[];
  sources: readonly ScoringSource[];
}): Promise<EventSourceRows> {
  const settled = await Promise.allSettled(
    sources.map(async (source) => {
      const data = await loadScoringEventData({
        year,
        eventCode,
        teams,
        sources: [source],
      });
      const rows: readonly ScoringRow[] = data.sources[source];
      return rows;
    }),
  );

  const result: EventSourceRows = { rows: {}, failures: new Map() };
  settled.forEach((outcome, index) => {
    const source = sources[index];
    if (outcome.status === "fulfilled") {
      result.rows[source] = outcome.value;
    } else {
      result.failures.set(
        source,
        outcome.reason instanceof Error
          ? outcome.reason.message
          : "The source could not be loaded.",
      );
    }
  });
  return result;
}

/** The sources that the saved configs read. Invalid configs read nothing. */
export function getSourcesForConfigs(configs: readonly unknown[]) {
  const sources = new Set<ScoringSource>();
  for (const config of configs) {
    const parsed = winnerConfigSchema.safeParse(config);
    if (parsed.success) {
      for (const source of getRequiredSources(parsed.data)) {
        sources.add(source);
      }
    }
  }
  return [...sources];
}

/**
 * Runs the saved config of each automatic category against the event data.
 * A category gets an error when its config is not valid or a source it reads
 * failed to load.
 */
export function findEventCategoryWinners<CategoryId extends string>({
  categories,
  teams,
  sourceRows,
}: {
  categories: readonly { categoryId: CategoryId; config: unknown }[];
  teams: readonly number[];
  sourceRows: EventSourceRows;
}): ConfigCategoryOutcome<CategoryId>[] {
  return categories.map(({ categoryId, config }) => {
    const parsed = winnerConfigSchema.safeParse(config);
    if (!parsed.success) {
      return {
        categoryId,
        type: "error",
        message: `The saved config is not valid: ${parsed.error.issues
          .map((issue) => issue.message)
          .join(" ")}`,
      };
    }

    const failed = getRequiredSources(parsed.data).flatMap((source) => {
      const message = sourceRows.failures.get(source);
      return message === undefined ? [] : [`${source}: ${message}`];
    });
    if (failed.length > 0) {
      return {
        categoryId,
        type: "error",
        message: `Could not load ${failed.join(" ")}`,
      };
    }

    try {
      const result = findCategoryWinners(parsed.data, {
        teams,
        sources: sourceRows.rows,
      });
      return { categoryId, type: "config", ...result };
    } catch (error) {
      return {
        categoryId,
        type: "error",
        message:
          error instanceof Error ? error.message : "The config failed to run.",
      };
    }
  });
}

/**
 * Checks manual winners against the teams at the event. Returns the team
 * numbers without duplicates, in ascending order.
 */
export function checkManualWinners(
  winners: readonly number[],
  eventTeams: ReadonlySet<number>,
): number[] {
  const unique = [...new Set(winners)].toSorted((a, b) => a - b);
  const unknown = unique.filter((team) => !eventTeams.has(team));
  if (unknown.length > 0) {
    throw new Error(
      `These teams are not at the event: ${unknown.join(", ")}.`,
    );
  }
  return unique;
}
