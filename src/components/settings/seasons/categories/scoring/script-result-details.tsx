"use client";

import { Disclosure } from "@heroui/react";

type ScriptTeamRow = { team: number; value: number | null; note: string | null };
type ScriptApiCall = { service: string; path: string; status: number | null; ms: number };

const SERVICE_LABELS: Record<string, string> = {
  tba: "TBA",
  statbotics: "Statbotics",
  frcEvents: "FRC Events",
};

/** The per-team detail and API calls of a script run, in disclosures. */
export default function ScriptResultDetails({
  teams,
  apiCalls,
  logs,
}: {
  teams: readonly ScriptTeamRow[];
  apiCalls: readonly ScriptApiCall[];
  logs?: readonly string[];
}) {
  return (
    <div className="flex flex-col">
      {teams.length > 0 ? (
        <Section title={`Team results (${teams.length})`}>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-default text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Team</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((row) => (
                  <tr key={row.team} className="border-t border-border">
                    <td className="px-3 py-2 font-medium tabular-nums">{row.team}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.value === null ? <span className="text-muted">None</span> : formatNumber(row.value)}
                    </td>
                    <td className="px-3 py-2 text-muted">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
      {apiCalls.length > 0 ? (
        <Section title={`API calls (${apiCalls.length})`}>
          <ul className="flex flex-col gap-1 text-sm">
            {apiCalls.map((call, index) => (
              <li key={`${call.service}${call.path}${index}`} className="flex min-w-0 items-baseline gap-2">
                <span
                  className={
                    call.status !== null && call.status < 400
                      ? "shrink-0 text-xs font-medium text-success"
                      : "shrink-0 text-xs font-medium text-danger"
                  }
                >
                  {call.status ?? "Failed"}
                </span>
                <span className="shrink-0 text-muted">{SERVICE_LABELS[call.service] ?? call.service}</span>
                <span className="truncate font-mono text-xs">{call.path}</span>
                <span className="ml-auto shrink-0 text-xs text-muted tabular-nums">{call.ms} ms</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {logs && logs.length > 0 ? (
        <Section title={`Logs (${logs.length})`}>
          <pre className="max-h-64 overflow-auto rounded-xl bg-default p-3 font-mono text-xs whitespace-pre-wrap">
            {logs.join("\n")}
          </pre>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Disclosure>
      <Disclosure.Heading>
        <Disclosure.Trigger className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted">
          {title}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="pb-2">{children}</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
