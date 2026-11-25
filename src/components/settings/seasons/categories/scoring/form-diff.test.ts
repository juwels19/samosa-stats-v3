import { describe, expect, it } from "vitest";

import { diffFormValues, markKeyForPath } from "./form-diff";
import { DEFAULT_FORM_VALUES, DEFAULT_MEASURE } from "./form-values";

describe("diffFormValues", () => {
  it("marks changed fields, groups and new measures", () => {
    const after = {
      ...DEFAULT_FORM_VALUES,
      matches: "playoffs" as const,
      measures: [
        { ...DEFAULT_MEASURE, op: "avg" as const },
        { ...DEFAULT_MEASURE, name: "second" },
      ],
      n: "3",
    };

    expect(diffFormValues(DEFAULT_FORM_VALUES, after)).toEqual([
      "matches",
      "measures.0.op",
      "measures.1",
      "select",
    ]);
  });

  it("marks the endpoint when a measure changes to a custom source", () => {
    const after = {
      ...DEFAULT_FORM_VALUES,
      measures: [{ ...DEFAULT_MEASURE, source: "api" as const }],
    };

    expect(diffFormValues(DEFAULT_FORM_VALUES, after)).toEqual([
      "measures.0.source",
      "measures.0.api",
    ]);
  });

  it("ignores fields the active value type does not use", () => {
    const after = { ...DEFAULT_FORM_VALUES, left: "unused" };
    expect(diffFormValues(DEFAULT_FORM_VALUES, after)).toEqual([]);
  });
});

describe("markKeyForPath", () => {
  it("maps form paths to the mark they clear", () => {
    expect(markKeyForPath("measures.2.apiPath")).toBe("measures.2.api");
    expect(markKeyForPath("measures.0.where.1.value")).toBe("measures.0.where");
    expect(markKeyForPath("valueMeasure")).toBe("value");
    expect(markKeyForPath("n")).toBe("select");
    expect(markKeyForPath("mode")).toBeNull();
  });
});
