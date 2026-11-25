import { describe, expect, it } from "vitest";

import { evaluateExpression, formatFormula, getReferencedMeasures, parseFormula } from "./formula";

function parse(text: string) {
  const result = parseFormula(text);
  if (!result.ok) throw new Error(result.message);
  return result.expression;
}

describe("parseFormula", () => {
  it("reads a name with one whole number as one name", () => {
    expect(parseFormula("teamPicks( 6 ) + 1")).toEqual({
      ok: true,
      expression: { op: "add", left: "teamPicks(6)", right: 1 },
    });
  });

  it("reads one operation the same way as the old left and right fields", () => {
    expect(parse("climbs / matches")).toEqual({ op: "divide", left: "climbs", right: "matches" });
  });

  it("does multiply and divide before add and subtract", () => {
    expect(parse("a + b * 2")).toEqual({
      op: "add",
      left: "a",
      right: { op: "multiply", left: "b", right: 2 },
    });
  });

  it("follows parentheses and accepts × ÷ −", () => {
    expect(parse("(auto − teleop) ÷ matches × 100")).toEqual({
      op: "multiply",
      left: {
        op: "divide",
        left: { op: "subtract", left: "auto", right: "teleop" },
        right: "matches",
      },
      right: 100,
    });
  });

  it("reads negative numbers", () => {
    expect(parse("-2 * a")).toEqual({ op: "multiply", left: -2, right: "a" });
  });

  it("explains a formula it can't read", () => {
    expect(parseFormula("")).toEqual({ ok: false, message: "Enter a formula." });
    expect(parseFormula("(a + b")).toEqual({ ok: false, message: "A ( has no matching )." });
    expect(parseFormula("a b")).toMatchObject({ ok: false });
    expect(parseFormula("a + * b")).toMatchObject({ ok: false });
    expect(parseFormula("a & b")).toMatchObject({ ok: false });
    expect(parseFormula("floor(a")).toEqual({ ok: false, message: "floor( has no matching )." });
    expect(parseFormula("auto(a + 1)")).toMatchObject({ ok: false });
  });

  it("reads integer division and mod at the same level as multiply", () => {
    expect(parseFormula("a + b // 2 % c")).toEqual({
      ok: true,
      expression: {
        op: "add",
        left: "a",
        right: { op: "mod", left: { op: "intDivide", left: "b", right: 2 }, right: "c" },
      },
    });
  });

  it("reads round, ceil and floor of a formula", () => {
    expect(parseFormula("round(a / b) - ceil(2.1)")).toEqual({
      ok: true,
      expression: {
        op: "subtract",
        left: { fn: "round", arg: { op: "divide", left: "a", right: "b" } },
        right: { fn: "ceil", arg: 2.1 },
      },
    });
  });
});

describe("evaluateExpression with rounding, integer division and mod", () => {
  const run = (text: string, measures: Record<string, number | null> = {}) =>
    evaluateExpression(parse(text), measures).value;

  it("rounds", () => {
    expect(run("round(2.5)")).toBe(3);
    expect(run("round(-2.5)")).toBe(-2);
    expect(run("ceil(2.1)")).toBe(3);
    expect(run("floor(-2.1)")).toBe(-3);
  });

  it("does integer division and mod so that a = b * (a // b) + a % b", () => {
    expect(run("7 // 2")).toBe(3);
    expect(run("-7 // 2")).toBe(-4);
    expect(run("7 % 3")).toBe(1);
    expect(run("-7 % 3")).toBe(2);
  });

  it("gives divide by zero for // and %", () => {
    expect(evaluateExpression(parse("a // 0"), { a: 1 })).toEqual({
      value: null,
      excludedReason: "divideByZero",
    });
    expect(evaluateExpression(parse("a % b"), { a: 1, b: 0 })).toMatchObject({ value: null });
  });
});

describe("formatFormula", () => {
  it("adds only the parentheses it needs, so a formula reads back the same", () => {
    for (const text of [
      "a / b",
      "(a - b) / c * 100",
      "a - (b - c)",
      "a / (b * c)",
      "a + b * c",
      "a * (b // c)",
      "a % (b * c)",
      "floor(a / b) + teamPicks(6)",
      "(a + b) // 2",
    ]) {
      expect(formatFormula(parse(text))).toBe(text);
    }
  });
});

describe("evaluateExpression", () => {
  it("calculates nested operations", () => {
    expect(evaluateExpression(parse("(a - b) / c * 100"), { a: 9, b: 3, c: 12 })).toEqual({ value: 50 });
  });

  it("gives the reason when it can't calculate", () => {
    expect(evaluateExpression(parse("a / (b - b)"), { a: 1, b: 2 })).toEqual({
      value: null,
      excludedReason: "divideByZero",
    });
    expect(evaluateExpression(parse("a + b"), { a: 1, b: null })).toEqual({
      value: null,
      excludedReason: "missingData",
    });
  });

  it("lists the measures it reads", () => {
    expect(getReferencedMeasures(parse("(a - b) / a * 2"))).toEqual(["a", "b", "a"]);
  });
});
