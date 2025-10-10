import { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-8 h-full px-6 py-4">
      This is where the nav goes
      <div className="grow">{children}</div>
    </div>
  );
}
