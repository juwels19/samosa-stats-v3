import SettingsSidebar from "@/components/settings/sidebar/settings-sidebar";
import { requireApprovedUser } from "@/lib/admin";
import { ReactNode } from "react";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireApprovedUser();

  return (
    <div className="flex gap-8 h-full px-6 py-4">
      <SettingsSidebar />
      <div className="grow">{children}</div>
    </div>
  );
}
