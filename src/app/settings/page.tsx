import { redirect, RedirectType } from "next/navigation";

export const metadata = {
  title: "Settings",
  description: "Samosa stats settings",
};

export default function SettingsPage() {
  return redirect("/settings/seasons", RedirectType.push);
}
