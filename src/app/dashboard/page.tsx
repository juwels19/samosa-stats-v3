import { requireApprovedUser } from "@/lib/admin";

export const metadata = {
  title: "Dashboard",
  description: "Samosa stats dashboard",
};

export default async function DashboardPage() {
  await requireApprovedUser();

  return <div>This is the dashboard page</div>;
}
