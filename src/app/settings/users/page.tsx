import UsersSettings from "@/components/settings/users/users-settings";
import { requireAdmin } from "@/lib/admin";

export const metadata = {
  title: "Users",
  description: "Give users a role",
};

export default async function UsersSettingsPage() {
  await requireAdmin();
  return <UsersSettings />;
}
