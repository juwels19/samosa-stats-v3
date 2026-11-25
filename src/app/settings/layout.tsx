import SettingsTabs from "@/components/settings/sidebar/settings-tabs";
import { areMocksEnabled, requireApprovedUser } from "@/lib/admin";
import type { ReactNode } from "react";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [currentUser, mocksEnabled] = await Promise.all([
    requireApprovedUser(),
    areMocksEnabled(),
  ]);

  return (
    <>
      <SettingsTabs
        isAdmin={currentUser?.isAdmin === true}
        showTesting={mocksEnabled && currentUser?.isAdmin === true}
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</div>
    </>
  );
}
