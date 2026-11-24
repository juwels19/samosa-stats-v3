import { requireApprovedUser } from "@/lib/admin";
import DashboardEvents from "@/components/dashboard/dashboard-events";

export const metadata = {
  title: "Dashboard",
  description: "Samosa Stats dashboard",
};

export default async function DashboardPage() {
  await requireApprovedUser();

  return <DashboardEvents />;
}
