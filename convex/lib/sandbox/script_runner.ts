"use node";

import { Sandbox } from "@vercel/sandbox";
import * as z from "zod";

import type { ScriptContextData } from "../scoring/script/contract";
import { getStatboticsBaseUrl } from "../scoring/sources/statbotics";
import {
  FRC_EVENTS_HOST,
  getSandboxCredentials,
  getScoringNetworkPolicy,
  TBA_HOST,
} from "./network_policy";

/**
 * Runs scoring scripts in a Vercel Sandbox. Only import this from "use node"
 * actions. One sandbox can run many scripts, one after another or at the
 * same time: each run has its own folder.
 */

const RESULT_MARKER = "__SCRIPT_RESULT__";
const RUN_TIMEOUT_MS = 60_000;
const MAX_LOG_LINES = 40;

const apiCallSchema = z.object({
  service: z.string(),
  path: z.string(),
  status: z.number().nullable(),
  bytes: z.number(),
  ms: z.number(),
});

const runnerOutputSchema = z.union([
  z.object({
    ok: z.literal(true),
    result: z.unknown(),
    calls: z.array(apiCallSchema),
    logs: z.array(z.string()),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
    calls: z.array(apiCallSchema),
    logs: z.array(z.string()),
  }),
]);

export type ScriptApiCall = z.infer<typeof apiCallSchema>;

export type ScriptRun =
  | { ok: true; result: unknown; calls: ScriptApiCall[]; logs: string[]; ms: number }
  | { ok: false; error: string; calls: ScriptApiCall[]; logs: string[]; ms: number };

export type ScriptSandbox = {
  run: (code: string, context: ScriptContextData) => Promise<ScriptRun>;
};

/** Starts a sandbox, gives it to `task`, then stops it. */
export async function withScriptSandbox<T>(
  task: (sandbox: ScriptSandbox) => Promise<T>,
  { timeoutMs = 10 * 60_000 }: { timeoutMs?: number } = {},
): Promise<T> {
  const sandbox = await Sandbox.create({
    ...getSandboxCredentials(),
    image: "vercel/sandbox/node:24",
    timeout: timeoutMs,
    resources: { vcpus: 1 },
    networkPolicy: getScoringNetworkPolicy(),
    tags: { purpose: "scoring-script" },
  });

  try {
    await sandbox.writeFiles([{ path: "runner.mjs", content: runnerSource() }]);
    let runCount = 0;

    const run = async (code: string, context: ScriptContextData): Promise<ScriptRun> => {
      runCount += 1;
      const dir = `run${runCount}`;
      const startedAt = Date.now();
      await sandbox.writeFiles([
        { path: `${dir}/script.mjs`, content: code },
        { path: `${dir}/ctx.json`, content: JSON.stringify(context) },
      ]);
      const command = await sandbox.runCommand("node", ["runner.mjs", dir], {
        timeoutMs: RUN_TIMEOUT_MS,
      });
      const [stdout, stderr] = await Promise.all([command.stdout(), command.stderr()]);
      const ms = Date.now() - startedAt;

      const markerAt = stdout.lastIndexOf(RESULT_MARKER);
      if (markerAt === -1) {
        const reason =
          command.exitCode === 137
            ? `The script ran for more than ${RUN_TIMEOUT_MS / 1000} seconds.`
            : `The script stopped with exit code ${command.exitCode}.`;
        return { ok: false, error: `${reason}\n${stderr.slice(-2000)}`.trim(), calls: [], logs: [], ms };
      }
      const parsed = runnerOutputSchema.safeParse(
        safeJson(stdout.slice(markerAt + RESULT_MARKER.length).trim()),
      );
      if (!parsed.success) {
        return { ok: false, error: "The script's result could not be read.", calls: [], logs: [], ms };
      }
      return { ...parsed.data, ms };
    };

    return await task({ run });
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * The program that runs in the sandbox. It loads `ctx.json`, adds the API
 * helpers, freezes ctx and calls the script's default export. It prints the
 * result after a marker, so the script's own logs can't be read as a result.
 */
function runnerSource() {
  const bases = {
    tba: `https://${TBA_HOST}/api/v3`,
    statbotics: getStatboticsBaseUrl(),
    frcEvents: `https://${FRC_EVENTS_HOST}/v3.0`,
  };

  return `
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { inspect } from "node:util";

const dir = process.argv[2];
const BASES = ${JSON.stringify(bases)};
const calls = [];
const logs = [];
const cache = new Map();

function log(...args) {
  if (logs.length >= ${MAX_LOG_LINES}) return;
  const line = args.map((arg) => (typeof arg === "string" ? arg : inspect(arg, { depth: 3 }))).join(" ");
  logs.push(line.slice(0, 500));
}
console.log = log;
console.info = log;
console.warn = log;
console.error = log;
console.debug = log;

// The same input must give the same result.
Math.random = () => {
  throw new Error("Math.random is not allowed. Scripts must give the same result each time.");
};

async function get(service, path) {
  if (typeof path !== "string" || !path.startsWith("/")) {
    throw new Error(service + " path must start with /, for example /event/2026onosh/matches.");
  }
  const key = service + path;
  if (!cache.has(key)) cache.set(key, request(service, path));
  return structuredClone(await cache.get(key));
}

async function request(service, path) {
  const startedAt = Date.now();
  const call = { service, path, status: null, bytes: 0, ms: 0 };
  calls.push(call);
  try {
    const res = await fetch(BASES[service] + path, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    call.status = res.status;
    call.bytes = text.length;
    if (!res.ok) throw new Error(service + " " + path + " returned " + res.status + ": " + text.slice(0, 200));
    return JSON.parse(text);
  } finally {
    call.ms = Date.now() - startedAt;
  }
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

let output;
try {
  const data = JSON.parse(await readFile(resolve(dir, "ctx.json"), "utf8"));
  const ctx = deepFreeze({
    ...data,
    api: {
      tba: (path) => get("tba", path),
      statbotics: (path) => get("statbotics", path),
      frcEvents: (path) => get("frcEvents", path),
    },
  });
  const mod = await import(pathToFileURL(resolve(dir, "script.mjs")).href);
  if (typeof mod.default !== "function") {
    throw new Error("The script must have export default async function score(ctx).");
  }
  const result = await mod.default(ctx);
  output = { ok: true, result: JSON.parse(JSON.stringify(result ?? null)), calls, logs };
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  output = { ok: false, error: message.split("\\n").slice(0, 6).join("\\n"), calls, logs };
}
process.stdout.write("\\n${RESULT_MARKER}" + JSON.stringify(output) + "\\n");
`;
}
