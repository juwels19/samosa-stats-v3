import { redirect, RedirectType } from "next/navigation";

export const metadata = {
  title: "Settings",
  description: "Samosa stats settings",
};

export default function SeasonSettingsPage() {
  return redirect("/settings/seasons/active-season", RedirectType.push);
}
