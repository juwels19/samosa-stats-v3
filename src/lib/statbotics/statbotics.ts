import { StatboticsMatchResult, StatboticsTeamEventResult } from "@/lib/statbotics/types";

const fetchStatbotics = async (
  path: string,
  method: string,
  cache?:
    | "default"
    | "no-store"
    | "reload"
    | "no-cache"
    | "force-cache"
    | "only-if-cached",
) =>
  fetch(`https://api.statbotics.io/v3${path}`, {
    method,
    cache,
    ...(cache === "no-store"
      ? {}
      : {
        next: {
          revalidate: 60 * 10, // 10 minutes
        },
      }),
  });


export async function getStatboticsMatchResults({ eventCode, year }: { eventCode: string, year: number }) {
  const params = new URLSearchParams({
    event: year.toString() + eventCode,
  });
  const response = await fetchStatbotics(`/matches?${params.toString()}`, "GET");
  const data = await response.json() as StatboticsMatchResult[];
  return data;
}

export async function getStatboticsEventResults({ eventCode, year }: { eventCode: string, year: number }) {
  const params = new URLSearchParams({
    event: year.toString() + eventCode,
    year: year.toString(),
  });
  const response = await fetchStatbotics(`/team_events?${params.toString()}`, "GET");
  const data = await response.json() as StatboticsTeamEventResult[];
  return data;
}