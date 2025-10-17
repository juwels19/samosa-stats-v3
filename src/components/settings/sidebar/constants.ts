import { CalendarIcon, ListCollapseIcon, LucideIcon, SunSnowIcon } from "lucide-react";

export interface SettingsSidebarItem {
  label: string;
  items: {
    label: string;
    icon: LucideIcon;
    href: string;
  }[]
}

export const settingsSidebarItems: SettingsSidebarItem[] = [
  {
    label: "Season Settings",
    items: [
      { icon: SunSnowIcon, label: "Active Season", href: '/settings/seasons/active-season' },
      { icon: CalendarIcon, label: "Events", href: "/settings/seasons/events" },
      { icon: ListCollapseIcon, label: "Categories", href: "/settings/seasons/categories" }
    ]
  }
] as const;