import type { FunctionReturnType } from "convex/server";

import type { api } from "../../../convex/_generated/api";

export type EventScoringData = NonNullable<
  FunctionReturnType<typeof api.scoring.getEventScoring>
>;
export type EventScoringCategory = EventScoringData["categories"][number];
export type EventTeam = EventScoringData["teams"][number];
