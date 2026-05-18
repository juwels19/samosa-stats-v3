import { requireApprovedUser } from "@/lib/admin";
import DashboardEvents from "@/components/dashboard/dashboard-events";

export const metadata = {
  title: "Dashboard",
  description: "Samosa stats dashboard",
};

export default async function DashboardPage() {
  await requireApprovedUser();

  return (
    <div className="flex flex-col gap-6 px-6 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
      </div>
      <DashboardEvents />
    </div>
  );
}
