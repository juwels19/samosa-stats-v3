import { useMemo } from "react";

import { listFieldPaths } from "../../../../../../convex/lib/scoring/field_paths";
import type { ScoringSource } from "../../../../../../convex/lib/scoring/winner_config";

/** The field paths a source has in a season, for the field picker. */
export function useFieldPaths(source: ScoringSource, year: number) {
  return useMemo(() => listFieldPaths(source, year), [source, year]);
}
