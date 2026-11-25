export interface SettingsTab {
  label: string;
  href: string;
}

export const settingsTabs: SettingsTab[] = [
  { label: "Season", href: "/settings/seasons/active-season" },
  { label: "Events", href: "/settings/seasons/events" },
  { label: "Categories", href: "/settings/seasons/categories" },
];

/** Shown only to admins. */
export const aiTab: SettingsTab = { label: "AI", href: "/settings/ai" };

/** Shown only to admins on a deployment with mocks on. */
export const testingTab: SettingsTab = { label: "Testing", href: "/settings/testing" };
