import type {
  MatchScope,
  ScoringSource,
  TeamScope,
} from "../../../../../../convex/lib/scoring/winner_config";

export type Option<Value extends string> = {
  value: Value;
  label: string;
  description?: string;
};

export const SOURCE_OPTIONS: Option<ScoringSource>[] = [
  {
    value: "tba.matches",
    label: "TBA matches",
    description: "One row for each team in each played match",
  },
  {
    value: "tba.rankings",
    label: "TBA rankings",
    description: "One row for each team",
  },
  {
    value: "tba.alliances",
    label: "TBA alliances",
    description: "One row for each alliance team",
  },
  {
    value: "tba.awards",
    label: "TBA awards",
    description: "One row for each award a team won",
  },
  {
    value: "statbotics.teamEvents",
    label: "Statbotics team events",
    description: "One row for each team, with EPA",
  },
  {
    value: "statbotics.matches",
    label: "Statbotics matches",
    description: "One row for each team in each match, with EPA",
  },
];

export const FILTER_SOURCE_OPTIONS: Option<ScoringSource | "measure">[] = [
  {
    value: "measure",
    label: "Same source",
    description: "Filter this measure's rows",
  },
  ...SOURCE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    description: "Keep teams that have a matching row here",
  })),
];

export const TEAM_SCOPE_OPTIONS: Option<TeamScope>[] = [
  { value: "all", label: "All teams" },
  { value: "inEliminations", label: "Teams in eliminations" },
  { value: "notInEliminations", label: "Teams left out of eliminations" },
  { value: "captains", label: "Alliance captains" },
];

export const MATCH_SCOPE_OPTIONS: Option<MatchScope>[] = [
  { value: "qualification", label: "Qualification matches" },
  { value: "playoffs", label: "Playoff matches" },
  { value: "all", label: "All matches" },
];

export const MEASURE_OP_OPTIONS = [
  { value: "value", label: "Value", description: "The field of the first row" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "max", label: "Maximum" },
  { value: "min", label: "Minimum" },
  {
    value: "count",
    label: "Count rows",
    description: "Rows that match the filters",
  },
] as const satisfies Option<string>[];

export const FILTER_OP_OPTIONS = [
  { value: "eq", label: "=" },
  { value: "neq", label: "≠" },
  { value: "in", label: "is one of" },
  { value: "notIn", label: "is not one of" },
  { value: "gt", label: ">" },
  { value: "gte", label: "≥" },
  { value: "lt", label: "<" },
  { value: "lte", label: "≤" },
] as const satisfies Option<string>[];

export const VALUE_MODE_OPTIONS = [
  { value: "measure", label: "One measure" },
  { value: "calculation", label: "Formula" },
] as const satisfies Option<string>[];

export const SELECT_TYPE_OPTIONS = [
  {
    value: "nth",
    label: "Nth value",
    description: "All teams with the nth distinct value",
  },
  {
    value: "top",
    label: "Top N teams",
    description: "The first n teams. Ties at the cutoff also win",
  },
  {
    value: "threshold",
    label: "Threshold",
    description: "All teams above or below a number",
  },
  {
    value: "equals",
    label: "Equals",
    description: "All teams with a value equal to a number",
  },
] as const satisfies Option<string>[];

export const ORDER_OPTIONS = [
  { value: "desc", label: "Highest first" },
  { value: "asc", label: "Lowest first" },
] as const satisfies Option<string>[];

export const THRESHOLD_OP_OPTIONS = [
  { value: "gt", label: ">" },
  { value: "gte", label: "≥" },
  { value: "lt", label: "<" },
  { value: "lte", label: "≤" },
] as const satisfies Option<string>[];

export const EXCLUDED_REASON_LABELS = {
  notInScope: "Not in team scope",
  missingData: "No data",
  divideByZero: "Divides by 0",
} as const;

export const WINNER_MODE_OPTIONS = [
  {
    value: "config",
    label: "Data rule",
    description: "Rank teams with TBA or Statbotics data. AI can build it.",
  },
  {
    value: "script",
    label: "AI script",
    description: "AI writes code that can read any API and the picks.",
  },
  {
    value: "leastUnique",
    label: "Least unique",
    description: "The submission whose teams were picked the most. No setup.",
  },
  {
    value: "manual",
    label: "Admin selects",
    description: "You select the winning teams after the event.",
  },
] as const satisfies Option<"config" | "script" | "leastUnique" | "manual">[];

export const POINTS_SOURCE_OPTIONS = [
  {
    value: "formula",
    label: "Formula",
    description: "Calculated from the picks at each event.",
  },
  {
    value: "script",
    label: "AI script",
    description: "The script returns the points at each event.",
  },
  {
    value: "manual",
    label: "Admin sets per team",
    description: "You set each winning team's points with the winners.",
  },
] as const satisfies Option<"formula" | "script" | "manual">[];

/** Readable names for the values of some fields, by field path. */
export const FIELD_VALUE_LABELS: Partial<
  Record<string, Record<string, string>>
> = {
  compLevel: {
    pm: "Practice",
    qm: "Qualification",
    ef: "Eighthfinal",
    qf: "Quarterfinal",
    sf: "Semifinal (double elimination rounds)",
    f: "Final",
  },
  finalLevel: {
    pm: "Practice",
    qm: "Qualification",
    ef: "Eighthfinal",
    qf: "Quarterfinal",
    sf: "Semifinal (double elimination rounds)",
    f: "Final",
  },
  role: {
    captain: "Captain",
    pick1: "First pick",
    pick2: "Second pick",
    pick3: "Third pick",
    backup: "Backup",
  },
  allianceStatus: {
    eliminated: "Eliminated",
    playing: "Still playing",
    won: "Won the event",
  },
  outcome: { win: "Win", loss: "Loss", tie: "Tie" },
  alliance: { red: "Red", blue: "Blue" },
};

export const MEASURE_SOURCE_OPTIONS: Option<ScoringSource | "api">[] = [
  ...SOURCE_OPTIONS,
  {
    value: "api",
    label: "Custom endpoint",
    description: "An event endpoint of TBA, Statbotics or FRC Events",
  },
];

export const API_SERVICE_OPTIONS = [
  { value: "tba", label: "The Blue Alliance", description: "Paths start with /event/{eventKey}" },
  { value: "statbotics", label: "Statbotics", description: "Paths include {eventKey}" },
  { value: "frcEvents", label: "FRC Events", description: "Paths start with /{year}/ and include {eventCode}" },
] as const satisfies Option<string>[];
