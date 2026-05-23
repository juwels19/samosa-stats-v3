export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SIGN_IN: "/sign-in",
  WAITLIST: "/waitlist",
  LEADERBOARD: "/leaderboard",
  APPROVALS: "/approvals",
  SETTINGS: "/settings",
  PICKS: "/picks",
  SCORES: "/scores",
};

export function getPicksRoute(eventCode: string) {
  return `${ROUTES.PICKS}/${eventCode}`;
}
