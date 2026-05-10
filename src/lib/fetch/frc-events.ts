'use server';
import { serverEnv } from "@/env/server"

const authorizationCredential = btoa(
  `${serverEnv.FRC_EVENTS_USERNAME}:${serverEnv.FRC_EVENTS_API_TOKEN}`
);

export type FrcEvents_Season = {
  eventCount: number;
  gameName: string;
  kickoff: string;
  rookieStart: number;
  teamCount: number;
  frcChampionships: {
    name: string;
    startDate: string;
    location: string;
  }[];
};

const fetchFrcEvents = async (
  path: string,
  method: string,
  cache?:
    | "default"
    | "no-store"
    | "reload"
    | "no-cache"
    | "force-cache"
    | "only-if-cached"
) =>
  fetch(`https://frc-api.firstinspires.org/v3.0${path}`, {
    method,
    headers: {
      Authorization: `Basic ${authorizationCredential}`,
    },
    cache,
    next: {
      revalidate: 60 * 10, // 10 minutes
    },
  });

export async function getGameNameForYear(
  year: string
): Promise<string> {
  const normalizedYear = year.trim();
  if (!/^\d{4}$/.test(normalizedYear)) {
    throw new Error("Enter a four-digit season year.");
  }

  const result = await fetchFrcEvents(`/${normalizedYear}`, "GET");
  const responseBody = await result.text();

  if (!result.ok) {
    throw new Error(`Unable to fetch FRC season ${normalizedYear}.`);
  }

  if (responseBody.length === 0) {
    throw new Error(`No FRC season data found for ${normalizedYear}.`);
  }

  let data: FrcEvents_Season;
  try {
    data = JSON.parse(responseBody) as FrcEvents_Season;
  } catch {
    throw new Error(`Invalid FRC season data returned for ${normalizedYear}.`);
  }

  if (typeof data.gameName !== "string" || data.gameName.length === 0) {
    throw new Error(`No FRC game name found for ${normalizedYear}.`);
  }

  return data.gameName;
}
