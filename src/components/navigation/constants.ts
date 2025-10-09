import { ROUTES } from "@/lib/routes";

export const adminMenuItems = [
  { label: "Approvals", href: ROUTES.APPROVALS },
  { label: "Leaderboard", href: ROUTES.LEADERBOARD },
  { label: "Scores", href: ROUTES.SCORES },
  { label: "Settings", href: ROUTES.SETTINGS },
] as const;