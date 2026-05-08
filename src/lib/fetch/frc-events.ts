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
  const result = await fetchFrcEvents(`/${year}`, "GET");

  const data = await result.json() as FrcEvents_Season;
  return data.gameName;
}