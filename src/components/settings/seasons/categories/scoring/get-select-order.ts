import type { WinnerConfig } from "../../../../../../convex/lib/scoring/winner_config";

/** The order that the select rule ranks values in. */
export function getSelectOrder(config: WinnerConfig): "asc" | "desc" {
  return config.select.type === "nth" || config.select.type === "top"
    ? config.select.order
    : "desc";
}
