import * as z from "zod";

import { getStatboticsBaseUrl } from "./statbotics";
import { fetchTba, getTbaEventKey, teamNumberFromKey } from "./tba";

/**
 * A custom source: one event-scoped GET endpoint of TBA, Statbotics or FRC
 * Events, read as rows. Use it when no typed source has the data. See
 * "Custom sources" in docs/scoring.md.
 */

export const API_SERVICES = ["tba", "statbotics", "frcEvents"] as const;
export type ApiService = (typeof API_SERVICES)[number];

const FRC_EVENTS_BASE_URL = "https://frc-api.firstinspires.org/v3.0";
const PATH_CHARACTERS = /^[A-Za-z0-9_/{}?=&.,-]+$/;
const ROW_PATH = /^[A-Za-z0-9_.*$]*$/;
/** Rows above this are cut off, so one large response can't stall a run. */
const MAX_ROWS = 20_000;

/** Why a path can't be used, or null when it can. */
export function checkApiPath(service: ApiService, path: string): string | null {
  if (!path.startsWith("/")) return "The path must start with /.";
  if (path.includes("..") || path.includes("//")) return "The path can't contain .. or //.";
  if (!PATH_CHARACTERS.test(path)) return "The path has characters that are not allowed.";

  switch (service) {
    case "tba":
      return path.startsWith("/event/{eventKey}")
        ? null
        : "TBA paths must start with /event/{eventKey}.";
    case "statbotics":
      return path.includes("{eventKey}")
        ? null
        : "Statbotics paths must include {eventKey}, for example /matches?event={eventKey}.";
    case "frcEvents":
      return path.startsWith("/{year}/") && path.includes("{eventCode}")
        ? null
        : "FRC Events paths must start with /{year}/ and include {eventCode}.";
  }
}

export const apiSourceSpecSchema = z
  .object({
    service: z.enum(API_SERVICES),
    /** A path with {eventKey}, {eventCode} or {year}, for example `/event/{eventKey}/matches`. */
    path: z.string().trim().min(1),
    /** Where the rows are in the response. Empty means the response is the list. */
    rows: z.string().trim().regex(ROW_PATH, { message: "Use dots and * only." }).default(""),
    /**
     * Where the team is in each row. A `*` expands to one row for each match,
     * for example `alliances.*.team_keys.*`. `$key` means the rows are an
     * object keyed by team, for example `{ "frc254": 41.2 }`.
     */
    team: z.string().trim().min(1).regex(ROW_PATH, { message: "Use dots and * only." }),
  })
  .superRefine((spec, ctx) => {
    const issue = checkApiPath(spec.service, spec.path);
    if (issue) ctx.addIssue({ code: "custom", message: issue, path: ["path"] });
  });

export type ApiSourceSpec = z.infer<typeof apiSourceSpecSchema>;

/** Same specs get the same key, so each endpoint is fetched once. */
export function getApiSourceKey(spec: ApiSourceSpec) {
  return `${spec.service}:${spec.path}|${spec.rows}|${spec.team}`;
}

export function resolveApiPath(
  spec: Pick<ApiSourceSpec, "service" | "path">,
  { year, eventCode }: { year: number; eventCode: string },
) {
  const code = eventCode.trim();
  return spec.path
    .replaceAll("{eventKey}", getTbaEventKey(year, code))
    .replaceAll("{eventCode}", spec.service === "frcEvents" ? code.toUpperCase() : code.toLowerCase())
    .replaceAll("{year}", String(year));
}

/** Gets a resolved path from a service. Checks the path first. */
export async function fetchApi(
  service: ApiService,
  pathTemplate: string,
  event: { year: number; eventCode: string },
): Promise<unknown> {
  const issue = checkApiPath(service, pathTemplate);
  if (issue) throw new Error(issue);
  const path = resolveApiPath({ service, path: pathTemplate }, event);

  switch (service) {
    case "tba":
      return await fetchTba(path);
    case "statbotics":
      return await fetchJson(`${getStatboticsBaseUrl()}${path}`, {}, "Statbotics");
    case "frcEvents": {
      const username = process.env.FRC_EVENTS_USERNAME;
      const token = process.env.FRC_EVENTS_API_TOKEN;
      if (!username || !token) throw new Error("FRC Events API credentials are not set.");
      return await fetchJson(
        `${FRC_EVENTS_BASE_URL}${path}`,
        { Authorization: `Basic ${btoa(`${username}:${token}`)}` },
        "FRC Events",
      );
    }
  }
}

async function fetchJson(url: string, headers: Record<string, string>, label: string) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${label} returned ${response.status} for ${new URL(url).pathname}.`);
  }
  const data: unknown = await response.json();
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type Match = { value: unknown; context: unknown };

/**
 * Reads a path where `*` is every item of a list or every value of an
 * object. Each match keeps the value at the first `*`, as its context.
 */
export function selectPath(root: unknown, path: string): Match[] {
  const segments = path.split(".").filter((segment) => segment !== "");
  let matches: Match[] = [{ value: root, context: undefined }];

  for (const segment of segments) {
    const next: Match[] = [];
    for (const { value, context } of matches) {
      if (typeof value !== "object" || value === null) continue;
      if (segment === "*") {
        const children = Array.isArray(value) ? value : Object.values(value);
        for (const child of children) {
          next.push({ value: child, context: context === undefined ? child : context });
        }
      } else {
        const child = Array.isArray(value)
          ? /^\d+$/.test(segment) ? value[Number(segment)] : undefined
          : isRecord(value) ? value[segment] : undefined;
        if (child !== undefined) next.push({ value: child, context });
      }
    }
    matches = next;
  }
  return matches;
}

/** 254, "254" or "frc254" to 254. Null for anything else. */
export function toTeamNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isInteger(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  if (/^\d+$/.test(value)) return Number(value);
  return teamNumberFromKey(value);
}

export type ApiRow = { team: number; $context?: unknown } & Record<string, unknown>;

/** Turns a response into one row for each team found in each item. */
export function toApiRows(response: unknown, spec: Pick<ApiSourceSpec, "rows" | "team">): ApiRow[] {
  const listMatches = selectPath(response, spec.rows);
  if (spec.team === TEAM_KEY) {
    return toKeyedRows(listMatches.map(({ value }) => value));
  }
  const items = listMatches.flatMap(({ value }) => (Array.isArray(value) ? value : [value]));
  const rows: ApiRow[] = [];

  for (const item of items) {
    if (!isRecord(item)) continue;
    for (const { value, context } of selectPath(item, spec.team)) {
      const team = toTeamNumber(value);
      if (team === null) continue;
      rows.push({ ...item, team, $context: context });
      if (rows.length >= MAX_ROWS) return rows;
    }
  }
  return rows;
}

/** The team path for rows that are an object keyed by team. */
export const TEAM_KEY = "$key";

/**
 * One row for each entry of objects keyed by team. A number or other plain
 * value is in `value`. An object keeps its fields. Each row has `$key`.
 */
function toKeyedRows(maps: unknown[]): ApiRow[] {
  const rows: ApiRow[] = [];
  for (const map of maps) {
    if (!isRecord(map)) continue;
    for (const [key, entry] of Object.entries(map)) {
      const team = toTeamNumber(key);
      if (team === null) continue;
      rows.push({ ...(isRecord(entry) ? entry : { value: entry }), $key: key, team });
      if (rows.length >= MAX_ROWS) return rows;
    }
  }
  return rows;
}

/**
 * A short outline of a response for the model: the keys and types, and a
 * sample of the first items.
 */
export function summarizeResponse(response: unknown, maxLength = 6000): string {
  const outline = outlineOf(response, 0);
  const sample = JSON.stringify(sampleOf(response, 0), null, 1);
  const text = `Shape:\n${outline}\n\nSample:\n${sample}`;
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n…(cut off)` : text;
}

function outlineOf(value: unknown, depth: number, indent = ""): string {
  if (Array.isArray(value)) {
    const first = value[0];
    return `array(${value.length})${first === undefined ? "" : ` of\n${indent}  ${outlineOf(first, depth + 1, `${indent}  `)}`}`;
  }
  if (typeof value === "object" && value !== null) {
    if (depth > 4) return "object";
    return `{\n${Object.entries(value)
      .slice(0, 40)
      .map(([key, child]) => `${indent}  ${key}: ${outlineOf(child, depth + 1, `${indent}  `)}`)
      .join("\n")}\n${indent}}`;
  }
  return value === null ? "null" : typeof value;
}

function sampleOf(value: unknown, depth: number): unknown {
  if (Array.isArray(value)) return value.slice(0, 2).map((item) => sampleOf(item, depth + 1));
  if (typeof value === "object" && value !== null) {
    if (depth > 4) return "…";
    return Object.fromEntries(
      Object.entries(value).slice(0, 30).map(([key, child]) => [key, sampleOf(child, depth + 1)]),
    );
  }
  return value;
}
