import * as z from "zod";

import { getRowSchema } from "./sources/event_data";
import type { ScoringSource, WinnerConfig } from "./winner_config";

export type SourceFieldPaths = {
  /** Every known leaf path, for example `breakdown.hubScore.autoCount`. */
  paths: string[];
  /**
   * Paths with no schema below them, for example `breakdown` in a season with
   * no breakdown schema. Any path under one of these is allowed.
   */
  openPrefixes: string[];
  /** The allowed values of fields that have a fixed set, by path. */
  valueOptions: Record<string, FieldValue[]>;
};

export type FieldValue = string | number | boolean;

type JsonSchemaNode = {
  type?: string | string[];
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
  anyOf?: JsonSchemaNode[];
  oneOf?: JsonSchemaNode[];
  enum?: FieldValue[];
  const?: FieldValue;
};

const ROBOT_FIELD = /Robot[1-3](?=$|\.)/;
const ROBOT_FIELDS = /Robot[1-3](?=$|\.)/g;

/** Lists the field paths a source has in a season, for the field picker. */
export function listFieldPaths(
  source: ScoringSource,
  year: number,
): SourceFieldPaths {
  const jsonSchema = z.toJSONSchema(getRowSchema(source, year), {
    unrepresentable: "any",
  }) as JsonSchemaNode;

  const paths = new Set<string>();
  const openPrefixes = new Set<string>();
  const valueOptions: Record<string, FieldValue[]> = {};
  walk(jsonSchema, "", paths, openPrefixes, valueOptions);

  for (const path of [...paths]) {
    if (ROBOT_FIELD.test(path)) {
      const robotPath = path.replace(ROBOT_FIELDS, "Robot{n}");
      paths.add(robotPath);
      if (valueOptions[path]) {
        valueOptions[robotPath] = valueOptions[path];
      }
    }
  }

  return {
    paths: [...paths].sort(),
    openPrefixes: [...openPrefixes].sort(),
    valueOptions,
  };
}

function walk(
  node: JsonSchemaNode,
  path: string,
  paths: Set<string>,
  openPrefixes: Set<string>,
  valueOptions: Record<string, FieldValue[]>,
) {
  const variants = [...(node.anyOf ?? []), ...(node.oneOf ?? [])];
  if (variants.length > 0) {
    for (const variant of variants) {
      walk(variant, path, paths, openPrefixes, valueOptions);
    }
    return;
  }

  const types = Array.isArray(node.type) ? node.type : [node.type];

  if (node.properties) {
    for (const [key, child] of Object.entries(node.properties)) {
      walk(
        child,
        path ? `${path}.${key}` : key,
        paths,
        openPrefixes,
        valueOptions,
      );
    }
    return;
  }

  if (types.includes("array") && node.items) {
    walk(node.items, `${path}[i]`, paths, openPrefixes, valueOptions);
    return;
  }

  if (types.includes("null") && types.length === 1) {
    return;
  }

  if (node.type === undefined || types.includes("object")) {
    // No schema below this path.
    if (path) {
      openPrefixes.add(path);
    }
    return;
  }

  if (path) {
    paths.add(path);
    const values =
      node.enum ??
      (node.const !== undefined
        ? [node.const]
        : types.includes("boolean")
          ? [true, false]
          : undefined);
    if (values) {
      valueOptions[path] = [...(valueOptions[path] ?? []), ...values];
    }
  }
}

/** Changes `[0]` to `[i]` so a path can be compared with the listed paths. */
function normalizePath(path: string) {
  return path.trim().replace(/\[\d+\]/g, "[i]");
}

/** The allowed values of a field, or undefined when any value is allowed. */
export function getFieldValueOptions(
  fieldPaths: SourceFieldPaths,
  path: string,
): FieldValue[] | undefined {
  return fieldPaths.valueOptions[normalizePath(path)];
}

export function isKnownFieldPath(fieldPaths: SourceFieldPaths, path: string) {
  const normalized = normalizePath(path);
  return (
    fieldPaths.paths.includes(normalized) ||
    fieldPaths.openPrefixes.some(
      (prefix) =>
        normalized === prefix ||
        normalized.startsWith(`${prefix}.`) ||
        normalized.startsWith(`${prefix}[`),
    )
  );
}

export type UnknownFieldIssue = {
  measure: string;
  source: ScoringSource;
  field: string;
};

/** Finds field paths in a config that a source does not have in a season. */
export function findUnknownFields(
  config: WinnerConfig,
  year: number,
): UnknownFieldIssue[] {
  const issues: UnknownFieldIssue[] = [];

  for (const [measureName, measure] of Object.entries(config.measures)) {
    const fields = [
      ...(measure.field === undefined
        ? []
        : [{ source: measure.source, field: measure.field }]),
      ...measure.where.map((filter) => ({
        source: filter.source ?? measure.source,
        field: filter.field,
      })),
    ];

    for (const { source, field } of fields) {
      if (!isKnownFieldPath(listFieldPaths(source, year), field)) {
        issues.push({ measure: measureName, source, field });
      }
    }
  }

  return issues;
}
