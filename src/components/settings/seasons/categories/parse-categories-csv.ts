import { createCategoryFormSchema } from "./constants";

export type CsvCategoryRow = {
  /** Row number as a spreadsheet shows it (the header is row 1). */
  line: number;
  text: string;
  scoringDescription: string;
  isGlobal: boolean;
  errors: string[];
};

/** Columns: category, global, then an optional scoring description. */
export const CATEGORY_CSV_TEMPLATE = [
  "category,global,scoring",
  '"Robot tips over in a match",yes,"Each picked robot that tips over and stays down for 5 seconds or more."',
  '"Deep climb in a playoff match",no,',
].join("\n");

const HEADER_NAMES = {
  text: ["category", "text", "name", "category text"],
  scoring: ["scoring", "scoring description", "scoringdescription", "scoring_description", "description", "rule"],
  global: ["global", "isglobal", "is_global", "is global"],
};

const TRUE_VALUES = new Set(["yes", "y", "true", "1", "global", "x"]);
const FALSE_VALUES = new Set(["no", "n", "false", "0", "season", ""]);

/** RFC 4180 CSV: quoted fields, "" escapes, commas and newlines inside quotes, CRLF. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function findColumn(header: string[], names: string[]) {
  return header.findIndex((cell) => names.includes(cell.trim().toLowerCase()));
}

/**
 * Turns CSV text into category rows with per-row errors. Uses the header row
 * when it has known column names; otherwise reads columns as category,
 * global, scoring. Scoring is optional.
 */
export function parseCategoriesCsv(
  input: string,
  existingTexts: string[],
): { rows: CsvCategoryRow[]; error: string | null } {
  const table = parseCsv(input);
  if (table.length === 0) return { rows: [], error: "There are no rows." };

  const header = table[0];
  let columns = {
    text: findColumn(header, HEADER_NAMES.text),
    scoring: findColumn(header, HEADER_NAMES.scoring),
    global: findColumn(header, HEADER_NAMES.global),
  };
  const hasHeader = columns.text !== -1 || columns.scoring !== -1 || columns.global !== -1;
  if (!hasHeader) columns = { text: 0, global: 1, scoring: 2 };
  if (hasHeader && columns.text === -1) {
    return { rows: [], error: "The header needs a category column." };
  }

  const body = hasHeader ? table.slice(1) : table;
  if (body.length === 0) return { rows: [], error: "There are no category rows." };

  const seen = new Set(existingTexts.map((t) => t.trim().toLowerCase()));

  const rows = body.map((cells, index): CsvCategoryRow => {
    const line = index + (hasHeader ? 2 : 1);
    const text = (cells[columns.text] ?? "").trim();
    const scoringDescription =
      columns.scoring === -1 ? "" : (cells[columns.scoring] ?? "").trim();
    const rawGlobal = columns.global === -1 ? "" : (cells[columns.global] ?? "").trim().toLowerCase();
    const errors: string[] = [];

    let isGlobal = false;
    if (TRUE_VALUES.has(rawGlobal)) isGlobal = true;
    else if (!FALSE_VALUES.has(rawGlobal)) errors.push(`Global must be yes or no, not "${rawGlobal}".`);

    const result = createCategoryFormSchema.safeParse({ text, scoringDescription, isGlobal });
    if (!result.success) errors.push(...result.error.issues.map((issue) => issue.message));

    const key = text.toLowerCase();
    if (key && seen.has(key)) errors.push("This category already exists.");
    if (key) seen.add(key);

    return { line, text, scoringDescription, isGlobal, errors };
  });

  return { rows, error: null };
}
