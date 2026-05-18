"use server";

import { serverEnv } from "@/env/server";

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

type FrcEventsEventResponse = {
  code: string;
  name: string;
  dateStart: string;
  dateEnd: string;
};

export type FrcEvent = {
  eventCode: string;
  name: string;
  startDate: string;
  endDate: string;
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
    | "only-if-cached",
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
  year: string,
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

export async function getEventForYearAndCode({
  year,
  eventCode,
}: {
  year: number | string;
  eventCode: string;
}): Promise<FrcEvent> {
  const normalizedYear = String(year).trim();
  const normalizedEventCode = eventCode.trim().toUpperCase();

  if (!/^\d{4}$/.test(normalizedYear)) {
    throw new Error("Select an active season before loading an event.");
  }

  if (!/^[A-Z0-9]+$/.test(normalizedEventCode)) {
    throw new Error("Enter a valid event code.");
  }

  const result = await fetchFrcEvents(
    `/${normalizedYear}/events?eventCode=${encodeURIComponent(normalizedEventCode)}`,
    "GET",
  );
  const responseBody = await result.text();

  if (result.status === 404) {
    throw new Error(
      `No FRC event found for code ${normalizedEventCode} in ${normalizedYear}.`,
    );
  }

  if (!result.ok) {
    throw new Error(`Unable to fetch FRC event ${normalizedEventCode}.`);
  }

  if (responseBody.length === 0) {
    throw new Error(`No FRC event data found for ${normalizedEventCode}.`);
  }

  let data: unknown;
  try {
    data = JSON.parse(responseBody);
  } catch {
    throw new Error(
      `Invalid FRC event data returned for ${normalizedEventCode}.`,
    );
  }

  const event = getFirstEventFromResponse(data);

  if (event === null) {
    throw new Error(
      `No FRC event found for code ${normalizedEventCode} in ${normalizedYear}.`,
    );
  }

  return {
    eventCode: event.code,
    name: event.name,
    startDate: event.dateStart,
    endDate: event.dateEnd,
  };
}

function getFirstEventFromResponse(data: unknown): FrcEventsEventResponse | null {
  if (!isRecord(data)) {
    return null;
  }

  const events = data.Events ?? data.events;

  if (!Array.isArray(events)) {
    return null;
  }

  for (const event of events) {
    const parsedEvent = parseFrcEvent(event);

    if (parsedEvent !== null) {
      return parsedEvent;
    }
  }

  return null;
}

function parseFrcEvent(event: unknown): FrcEventsEventResponse | null {
  if (!isRecord(event)) {
    return null;
  }

  const code = getStringProperty(event, "code");
  const name = getStringProperty(event, "name");
  const dateStart = getStringProperty(event, "dateStart");
  const dateEnd = getStringProperty(event, "dateEnd");

  if (
    code.length === 0 ||
    name.length === 0 ||
    dateStart.length === 0 ||
    dateEnd.length === 0
  ) {
    return null;
  }

  return {
    code,
    name,
    dateStart,
    dateEnd,
  };
}

function getStringProperty(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
