import type { ReactNode } from "react";

/** Title row for a settings page. The action drops below the text on phones. */
export default function SettingsPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {action ? <div className="sm:shrink-0">{action}</div> : null}
    </header>
  );
}
