import SettingsTabs from "@/components/settings/sidebar/settings-tabs";
import { requireApprovedUser } from "@/lib/admin";
import type { ReactNode } from "react";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireApprovedUser();

  return (
    <>
      <SettingsTabs />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</div>
    </>
  );
}
