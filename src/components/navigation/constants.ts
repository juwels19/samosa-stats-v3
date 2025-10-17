import { ROUTES } from "@/lib/routes";

export const generalMenuItems = [
  { label: "Dashboard", href: ROUTES.DASHBOARD },
  { label: "Leaderboard", href: ROUTES.LEADERBOARD },
] as const;

export const adminMenuItems: { label: string, href: string }[] = [
  { label: "Approvals", href: ROUTES.APPROVALS },
  { label: "Scores", href: ROUTES.SCORES },
  { label: "Settings", href: ROUTES.SETTINGS },
] as const;