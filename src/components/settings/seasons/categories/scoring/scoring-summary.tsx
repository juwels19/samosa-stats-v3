import { TrophyIcon, UsersIcon, CoinsIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { WinnerMode } from "./form-values";

/**
 * The category's scoring in 3 plain sentences: who can score, who wins and
 * the points. Updates as the admin changes the setup, before it is saved.
 */
export default function ScoringSummary({
  isGlobal,
  mode,
  isConfigReady,
  pointsSource,
  valueFormula,
}: {
  isGlobal: boolean;
  mode: WinnerMode;
  /** True when the data rule is complete. */
  isConfigReady: boolean;
  pointsSource: "formula" | "script" | "manual";
  valueFormula: string;
}) {
  const formula = valueFormula.trim();
  const per = mode === "leastUnique" ? "The winning submission gets" : "Each winning team a player picked gives";

  const points = !isGlobal
    ? "Each winning team a player picked gives picks + 1 points. The most picked category gives less."
    : pointsSource === "manual"
      ? "Each winning team a player picked gives the points an admin sets for that team."
      : pointsSource === "script"
      ? `${per} the points the AI script returns at each event.`
      : formula === ""
        ? "No points formula yet, so it gives no points."
        : `${per} ${formula} points${mode === "leastUnique" ? " one time" : ""}, calculated at each event.`;

  return (
    <section aria-label="Scoring summary" className="rounded-3xl bg-surface p-4 sm:p-6">
      <dl className="grid gap-4 sm:grid-cols-3">
        <Row icon={<UsersIcon className="size-4" />} label="Who can score">
          {isGlobal
            ? "Every player. Players don't pick this category."
            : "Only players who pick this category."}
        </Row>
        <Row icon={<TrophyIcon className="size-4" />} label="Who wins">
          {WHO_WINS[mode](isConfigReady)}
        </Row>
        <Row icon={<CoinsIcon className="size-4" />} label="Points">
          {points}
        </Row>
      </dl>
    </section>
  );
}

const WHO_WINS: Record<WinnerMode, (isConfigReady: boolean) => string> = {
  config: (isReady) =>
    isReady ? "The teams a data rule picks from TBA or Statbotics data." : "A data rule. Finish it in step 1.",
  script: () => "The teams an AI script picks. It can read any API and the picks.",
  leastUnique: () => "The least unique submission: the one whose teams were picked the most.",
  manual: () => "The teams an admin selects after the event.",
};

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted uppercase">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-pretty">{children}</dd>
    </div>
  );
}
