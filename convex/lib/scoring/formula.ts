/**
 * Formulas for a config's value, for example `(auto - teleop) / matches * 100`.
 * A formula has measure names, numbers, + - * / (or × ÷) and parentheses.
 * It is stored as a tree of operations, so a single operation is the same
 * shape as before formulas existed.
 */

export type CalculationOp = "add" | "subtract" | "multiply" | "divide";

/** A measure name, a number, or an operation on two expressions. */
export type ValueExpression =
  | string
  | number
  | { op: CalculationOp; left: ValueExpression; right: ValueExpression };

export type FormulaResult =
  | { ok: true; expression: ValueExpression }
  | { ok: false; message: string };

type Token =
  | { type: "number"; value: number }
  | { type: "name"; value: string }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "open" }
  | { type: "close" };

const OPS: Record<"+" | "-" | "*" | "/", CalculationOp> = {
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
};

function tokenize(text: string): Token[] | string {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/\s/.test(char)) {
      i++;
    } else if (/[0-9.]/.test(char)) {
      const match = /^\d*\.?\d+(?:[eE][-+]?\d+)?|^\d+\.?/.exec(text.slice(i));
      const value = Number(match?.[0]);
      if (!match || !Number.isFinite(value)) return `"${char}" is not a valid number.`;
      tokens.push({ type: "number", value });
      i += match[0].length;
    } else if (/[A-Za-z]/.test(char)) {
      const match = /^[A-Za-z][A-Za-z0-9_]*/.exec(text.slice(i));
      const name = match?.[0] ?? char;
      tokens.push({ type: "name", value: name });
      i += name.length;
    } else if ("+-−*×/÷".includes(char)) {
      const op = char === "−" ? "-" : char === "×" ? "*" : char === "÷" ? "/" : char;
      if (op === "+" || op === "-" || op === "*" || op === "/") tokens.push({ type: "op", value: op });
      i++;
    } else if (char === "(") {
      tokens.push({ type: "open" });
      i++;
    } else if (char === ")") {
      tokens.push({ type: "close" });
      i++;
    } else {
      return `"${char}" can't be used in a formula. Use measure names, numbers, + - * / and parentheses.`;
    }
  }
  return tokens;
}

/** Parses a formula. Multiply and divide come before add and subtract. */
export function parseFormula(text: string): FormulaResult {
  const tokens = tokenize(text);
  if (typeof tokens === "string") return { ok: false, message: tokens };
  if (tokens.length === 0) return { ok: false, message: "Enter a formula." };

  let position = 0;
  const peek = () => tokens[position];

  function parseSum(): ValueExpression {
    let left = parseProduct();
    for (let token = peek(); token?.type === "op" && (token.value === "+" || token.value === "-"); token = peek()) {
      position++;
      left = { op: OPS[token.value], left, right: parseProduct() };
    }
    return left;
  }

  function parseProduct(): ValueExpression {
    let left = parseFactor();
    for (let token = peek(); token?.type === "op" && (token.value === "*" || token.value === "/"); token = peek()) {
      position++;
      left = { op: OPS[token.value], left, right: parseFactor() };
    }
    return left;
  }

  function parseFactor(): ValueExpression {
    const token = peek();
    position++;
    if (token === undefined) throw new FormulaError("The formula ends too early.");
    if (token.type === "number" || token.type === "name") return token.value;
    if (token.type === "op" && token.value === "-") {
      const operand = parseFactor();
      return typeof operand === "number" ? -operand : { op: "multiply", left: -1, right: operand };
    }
    if (token.type === "open") {
      const inner = parseSum();
      if (peek()?.type !== "close") throw new FormulaError("A ( has no matching ).");
      position++;
      return inner;
    }
    throw new FormulaError(
      token.type === "close" ? "A ) has no matching (." : "Two operations are next to each other.",
    );
  }

  try {
    const expression = parseSum();
    const extra = peek();
    if (extra !== undefined) {
      return {
        ok: false,
        message:
          extra.type === "close"
            ? "A ) has no matching (."
            : "Put an operation (+ - * /) between each name and number.",
      };
    }
    return { ok: true, expression };
  } catch (error) {
    if (error instanceof FormulaError) return { ok: false, message: error.message };
    throw error;
  }
}

class FormulaError extends Error {}

const SYMBOLS: Record<CalculationOp, string> = {
  add: "+",
  subtract: "-",
  multiply: "*",
  divide: "/",
};

const PRECEDENCE: Record<CalculationOp, number> = { add: 1, subtract: 1, multiply: 2, divide: 2 };

/** Writes an expression as a formula, with only the parentheses it needs. */
export function formatFormula(expression: ValueExpression): string {
  if (typeof expression !== "object") return String(expression);
  const precedence = PRECEDENCE[expression.op];
  const side = (operand: ValueExpression, isRight: boolean) => {
    const text = formatFormula(operand);
    if (typeof operand !== "object") return text;
    const inner = PRECEDENCE[operand.op];
    // a - (b - c) and a / (b * c) need parentheses on the right.
    const needs = inner < precedence || (isRight && inner === precedence && (expression.op === "subtract" || expression.op === "divide"));
    return needs ? `(${text})` : text;
  };
  return `${side(expression.left, false)} ${SYMBOLS[expression.op]} ${side(expression.right, true)}`;
}

/** The measure names an expression reads. */
export function getReferencedMeasures(expression: ValueExpression): string[] {
  if (typeof expression === "string") return [expression];
  if (typeof expression === "number") return [];
  return [...getReferencedMeasures(expression.left), ...getReferencedMeasures(expression.right)];
}

/** Calculates an expression. Null data or a divide by zero gives the reason. */
export function evaluateExpression(
  expression: ValueExpression,
  measures: Readonly<Record<string, number | null>>,
): { value: number } | { value: null; excludedReason: "missingData" | "divideByZero" } {
  if (typeof expression === "number") return { value: expression };
  if (typeof expression === "string") {
    const measured = measures[expression];
    return measured === null || measured === undefined
      ? { value: null, excludedReason: "missingData" }
      : { value: measured };
  }

  const left = evaluateExpression(expression.left, measures);
  if (left.value === null) return left;
  const right = evaluateExpression(expression.right, measures);
  if (right.value === null) return right;

  switch (expression.op) {
    case "add":
      return { value: left.value + right.value };
    case "subtract":
      return { value: left.value - right.value };
    case "multiply":
      return { value: left.value * right.value };
    case "divide":
      return right.value === 0
        ? { value: null, excludedReason: "divideByZero" }
        : { value: left.value / right.value };
  }
}
