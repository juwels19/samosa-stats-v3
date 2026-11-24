import { ROUTES } from "@/lib/routes";
import {
  LayoutDashboardIcon,
  type LucideIcon,
  SettingsIcon,
  TrophyIcon,
  UserCheckIcon,
  ClipboardListIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const generalMenuItems: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboardIcon },
  { label: "Leaderboard", href: ROUTES.LEADERBOARD, icon: TrophyIcon },
];

export const adminMenuItems: NavItem[] = [
  { label: "Approvals", href: ROUTES.APPROVALS, icon: UserCheckIcon },
  { label: "Scores", href: ROUTES.SCORES, icon: ClipboardListIcon },
  { label: "Settings", href: ROUTES.SETTINGS, icon: SettingsIcon },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
