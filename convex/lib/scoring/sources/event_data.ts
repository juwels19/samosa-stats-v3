import type * as z from "zod";

import { SCORING_SOURCES, type ScoringSource } from "../winner_config";
import {
  fetchStatboticsTeamEvents,
  getStatboticsTeamEventRowSchema,
  toStatboticsTeamEventRows,
  type StatboticsTeamEventRow,
} from "./statbotics";
import {
  fetchStatboticsMatches,
  getStatboticsMatchRowSchema,
  toStatboticsMatchRows,
  type StatboticsMatchRow,
} from "./statbotics_matches";
import {
  fetchTba,
  getTbaEventKey,
  getTbaMatchRowSchema,
  tbaAllianceRowSchema,
  tbaAwardRowSchema,
  tbaRankingRowSchema,
  toTbaAllianceRows,
  toTbaAwardRows,
  toTbaMatchRows,
  toTbaRankingRows,
  toTbaTeamNumbers,
  type TbaAllianceRow,
  type TbaAwardRow,
  type TbaMatchRow,
  type TbaRankingRow,
} from "./tba";

export type ScoringSourceRows<Year extends number = number> = {
  "statbotics.matches": StatboticsMatchRow<Year>[];
  "tba.matches": TbaMatchRow<Year>[];
  "tba.rankings": TbaRankingRow[];
  "tba.alliances": TbaAllianceRow[];
  "tba.awards": TbaAwardRow[];
  "statbotics.teamEvents": StatboticsTeamEventRow<Year>[];
};

export type ScoringEventData<Year extends number = number> = {
  year: Year;
  teams: number[];
  sources: ScoringSourceRows<Year>;
};

const rowSchemas: Record<ScoringSource, (year: number) => z.ZodType> = {
  "tba.matches": getTbaMatchRowSchema,
  "tba.rankings": () => tbaRankingRowSchema,
  "tba.alliances": () => tbaAllianceRowSchema,
  "tba.awards": () => tbaAwardRowSchema,
  "statbotics.teamEvents": getStatboticsTeamEventRowSchema,
  "statbotics.matches": getStatboticsMatchRowSchema,
};

/** The schema of one row of a source, for a season. */
export function getRowSchema(source: ScoringSource, year: number): z.ZodType {
  return rowSchemas[source](year);
}

/** Gets and checks all source data for an event. Run this in an action. */
export async function loadScoringEventData<Year extends number>({
  year,
  eventCode,
  teams,
  sources,
}: {
  year: Year;
  eventCode: string;
  /** Team numbers at the event. Gets the TBA team list when not given. */
  teams?: number[];
  /**
   * The sources to get. Sources not listed are empty. One source that is
   * down then can't stop a config that does not read it.
   */
  sources?: readonly ScoringSource[];
}): Promise<ScoringEventData<Year>> {
  const eventKey = getTbaEventKey(year, eventCode);
  const wanted = new Set<ScoringSource>(sources ?? SCORING_SOURCES);
  const load = <Rows>(
    source: ScoringSource,
    get: () => Promise<Rows>,
  ): Promise<Rows | []> => (wanted.has(source) ? get() : Promise.resolve([]));

  const [
    teamNumbers,
    matches,
    rankings,
    alliances,
    awards,
    teamEvents,
    statboticsMatches,
  ] = await Promise.all([
    teams === undefined
      ? fetchTba(`/event/${eventKey}/teams/keys`).then(toTbaTeamNumbers)
      : Promise.resolve(teams),
    load("tba.matches", async () =>
      toTbaMatchRows(await fetchTba(`/event/${eventKey}/matches`), year),
    ),
    load("tba.rankings", async () =>
      toTbaRankingRows(await fetchTba(`/event/${eventKey}/rankings`)),
    ),
    load("tba.alliances", async () =>
      toTbaAllianceRows(await fetchTba(`/event/${eventKey}/alliances`)),
    ),
    load("tba.awards", async () =>
      toTbaAwardRows(await fetchTba(`/event/${eventKey}/awards`)),
    ),
    load("statbotics.teamEvents", async () =>
      toStatboticsTeamEventRows(
        await fetchStatboticsTeamEvents(year, eventCode),
        year,
      ),
    ),
    load("statbotics.matches", async () =>
      toStatboticsMatchRows(
        await fetchStatboticsMatches(year, eventCode),
        year,
      ),
    ),
  ]);

  return {
    year,
    teams: teamNumbers,
    sources: {
      "tba.matches": matches,
      "tba.rankings": rankings,
      "tba.alliances": alliances,
      "tba.awards": awards,
      "statbotics.teamEvents": teamEvents,
      "statbotics.matches": statboticsMatches,
    },
  };
}
