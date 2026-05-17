import SettingsSidebar from "@/components/settings/sidebar/settings-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { requireApprovedUser } from "@/lib/admin";
import type { CSSProperties, ReactNode } from "react";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireApprovedUser();

  return (
    <SidebarProvider
      className="h-full min-h-0 overflow-hidden"
      style={{ "--sidebar-width": "11rem" } as CSSProperties}
    >
      <SettingsSidebar />
      <div className="min-w-0 flex-1 overflow-y-auto p-6">{children}</div>
    </SidebarProvider>
  );
}
