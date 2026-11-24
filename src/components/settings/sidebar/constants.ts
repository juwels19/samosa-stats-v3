export interface SettingsTab {
  label: string;
  href: string;
}

export const settingsTabs: SettingsTab[] = [
  { label: "Season", href: "/settings/seasons/active-season" },
  { label: "Events", href: "/settings/seasons/events" },
  { label: "Categories", href: "/settings/seasons/categories" },
];
