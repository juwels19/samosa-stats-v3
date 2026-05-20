"use server";

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

type FrcEventsTeamResponse = {
  teamNumber: number;
  nameShort: string;
  nameFull: string;
};

export type FrcEventTeam = {
  name: string;
  number: number;
};

export type FrcEvent = {
  eventCode: string;
  name: string;
  startDate: string;
  endDate: string;
  teams: FrcEventTeam[];
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
      Authorization: `Basic ${getFrcEventsAuthorizationCredential()}`,
    },
    cache,
    ...(cache === "no-store"
      ? {}
      : {
          next: {
            revalidate: 60 * 10, // 10 minutes
          },
        }),
  });

function getFrcEventsAuthorizationCredential() {
  const username = process.env.FRC_EVENTS_USERNAME;
  const token = process.env.FRC_EVENTS_API_TOKEN;

  if (!username || !token) {
    throw new Error("FRC Events API credentials are not configured.");
  }

  return btoa(`${username}:${token}`);
}

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

  const teams = await getTeamsForYearAndCode({
    year: normalizedYear,
    eventCode: event.code,
  });

  return {
    eventCode: event.code,
    name: event.name,
    startDate: event.dateStart,
    endDate: event.dateEnd,
    teams,
  };
}

export async function getTeamsForYearAndCode({
  year,
  eventCode,
}: {
  year: number | string;
  eventCode: string;
}): Promise<FrcEventTeam[]> {
  const normalizedYear = String(year).trim();
  const normalizedEventCode = eventCode.trim().toUpperCase();

  if (!/^\d{4}$/.test(normalizedYear)) {
    throw new Error("Select an active season before loading teams.");
  }

  if (!/^[A-Z0-9]+$/.test(normalizedEventCode)) {
    throw new Error("Enter a valid event code.");
  }

  const result = await fetchFrcEvents(
    `/${normalizedYear}/teams?eventCode=${encodeURIComponent(normalizedEventCode)}`,
    "GET",
    "no-store",
  );
  const responseBody = await result.text();

  if (result.status === 404) {
    throw new Error(
      `No FRC teams found for code ${normalizedEventCode} in ${normalizedYear}.`,
    );
  }

  if (!result.ok) {
    throw new Error(`Unable to fetch FRC teams for ${normalizedEventCode}.`);
  }

  if (responseBody.length === 0) {
    throw new Error(`No FRC team data found for ${normalizedEventCode}.`);
  }

  let data: unknown;
  try {
    data = JSON.parse(responseBody);
  } catch {
    throw new Error(
      `Invalid FRC team data returned for ${normalizedEventCode}.`,
    );
  }

  return getTeamsFromResponse(data);
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

function getTeamsFromResponse(data: unknown): FrcEventTeam[] {
  if (!isRecord(data)) {
    return [];
  }

  const teams = data.Teams ?? data.teams;

  if (!Array.isArray(teams)) {
    return [];
  }

  return teams.flatMap((team) => {
    const parsedTeam = parseFrcTeam(team);
    return parsedTeam === null ? [] : [parsedTeam];
  });
}

function parseFrcTeam(team: unknown): FrcEventTeam | null {
  if (!isRecord(team)) {
    return null;
  }

  const responseTeam: FrcEventsTeamResponse = {
    teamNumber: getNumberProperty(team, "teamNumber"),
    nameShort: getStringProperty(team, "nameShort"),
    nameFull: getStringProperty(team, "nameFull"),
  };
  const name = responseTeam.nameShort.trim() || responseTeam.nameFull.trim();

  if (!Number.isSafeInteger(responseTeam.teamNumber) || name.length === 0) {
    return null;
  }

  return {
    name,
    number: responseTeam.teamNumber,
  };
}

function getStringProperty(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function getNumberProperty(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : Number.NaN;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
