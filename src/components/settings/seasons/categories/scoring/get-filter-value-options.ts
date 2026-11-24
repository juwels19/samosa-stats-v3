import {
  getFieldValueOptions,
  type SourceFieldPaths,
} from "../../../../../../convex/lib/scoring/field_paths";
import {
  TBA_AWARD_TYPES,
  isCurrentAwardType,
} from "../../../../../../convex/lib/scoring/sources/tba_award_types";
import type { ScoringSource } from "../../../../../../convex/lib/scoring/winner_config";
import { FIELD_VALUE_LABELS } from "./constants";

export type ValueOption = {
  /** The value as the form stores it, for example `qm`, `21` or `true`. */
  id: string;
  label: string;
  description?: string;
  /** Extra text that search also matches, such as former names. */
  keywords?: string;
};

/**
 * The values a filter can pick from, or undefined when the field takes any
 * value. Awards use the award list; other fields use the season's schema.
 */
export function getFilterValueOptions(
  source: ScoringSource,
  field: string,
  fieldPaths: SourceFieldPaths,
): ValueOption[] | undefined {
  const path = field.trim();

  if (source === "tba.awards" && path === "awardType") {
    return TBA_AWARD_TYPES.filter(isCurrentAwardType).map((award) => ({
      id: String(award.value),
      label: award.label,
      keywords: [award.label, ...award.formerNames, String(award.value)].join(
        " ",
      ),
      description:
        award.formerNames.length > 0
          ? `${award.value} · formerly ${award.formerNames.join(", ")}`
          : String(award.value),
    }));
  }

  const values = getFieldValueOptions(fieldPaths, path);
  if (!values) {
    return undefined;
  }

  const labels: Partial<Record<string, string>> =
    FIELD_VALUE_LABELS[path] ?? {};
  return [...new Set(values)].map((value) => {
    const id = String(value);
    const label = labels[id];
    return label
      ? { id, label, description: id, keywords: `${label} ${id}` }
      : { id, label: id };
  });
}
