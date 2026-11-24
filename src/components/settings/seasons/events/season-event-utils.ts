import type { FrcSeasonEvent } from "@/lib/fetch/frc-events";

/** FRC event types that are not part of the official season. */
const OFF_SEASON_TYPES = new Set(["OffSeason", "OffSeasonWithAzureSync", "Preseason"]);

export function isOffSeason(event: FrcSeasonEvent) {
  return OFF_SEASON_TYPES.has(event.type);
}

/** Short label for the event type tag. */
export function eventTypeLabel(event: FrcSeasonEvent) {
  switch (event.type) {
    case "DistrictEvent":
      return "District";
    case "DistrictChampionship":
    case "DistrictChampionshipWithLevels":
      return "Championship";
    case "DistrictChampionshipDivision":
    case "ChampionshipSubdivision":
      return "Division";
    case "Championship":
      return "Worlds";
    case "Regional":
      return "Regional";
    default:
      return isOffSeason(event) ? "Off-season" : event.type;
  }
}

/**
 * A short display name from the FRC name, for example
 * "ONT District McMaster University Event" -> "McMaster University" and
 * "FIRST Ontario Provincial Championship - Science Division" -> "Provincials Science".
 */
export function defaultDisplayName(name: string) {
  const short = name
    .replace(/^FIRST Ontario Provincial Championship/i, "Provincials")
    .replace(/^(FIRST |FRC )?[A-Z]{2,4} District /, "")
    .replace(/ - (.+?) Division$/i, " $1")
    .replace(/ (District )?Event$/i, "")
    .replace(/ Regional$/i, "")
    .trim();
  return (short || name).slice(0, 80);
}
