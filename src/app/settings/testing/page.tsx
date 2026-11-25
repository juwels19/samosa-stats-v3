import { notFound } from "next/navigation";

import TestingPage from "@/components/settings/testing/testing-page";
import { areMocksEnabled, requireAdmin } from "@/lib/admin";

export const metadata = {
  title: "Testing",
  description: "Mock picks, mock events and the Discord log",
};

/** Only for admins, and only where the Convex env MOCKS_ENABLED is on. */
export default async function TestingSettingsPage() {
  const [, mocksEnabled] = await Promise.all([requireAdmin(), areMocksEnabled()]);
  if (!mocksEnabled) notFound();

  return <TestingPage />;
}
