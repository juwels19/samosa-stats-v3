import AiSettings from "@/components/settings/ai/ai-settings";
import { requireAdmin } from "@/lib/admin";

export const metadata = {
  title: "AI settings",
  description: "AI features and the models they use",
};

export default async function AiSettingsPage() {
  await requireAdmin();
  return <AiSettings />;
}
