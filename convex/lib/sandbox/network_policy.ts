import type { NetworkPolicy } from "@vercel/sandbox";

import { getStatboticsBaseUrl } from "../scoring/sources/statbotics";

export const TBA_HOST = "www.thebluealliance.com";
export const FRC_EVENTS_HOST = "frc-api.firstinspires.org";

/** The host of the Statbotics API (or its mirror) that the app uses. */
export function getStatboticsHost() {
  return new URL(getStatboticsBaseUrl()).host;
}

/**
 * The sandbox can only reach the 3 scoring APIs. All other hosts are blocked.
 *
 * The sandbox never gets the API keys. The sandbox network proxy adds the auth
 * headers to each request on the way out, so a script can't read or leak them.
 */
export function getScoringNetworkPolicy(): NetworkPolicy {
  const tbaKey = requireEnv("TBA_API_KEY");
  const frcAuth = btoa(
    `${requireEnv("FRC_EVENTS_USERNAME")}:${requireEnv("FRC_EVENTS_API_TOKEN")}`,
  );

  return {
    allow: {
      [TBA_HOST]: [{ transform: [{ headers: { "X-TBA-Auth-Key": tbaKey } }] }],
      [FRC_EVENTS_HOST]: [
        { transform: [{ headers: { Authorization: `Basic ${frcAuth}` } }] },
      ],
      [getStatboticsHost()]: [],
    },
  };
}

export function getSandboxCredentials() {
  return {
    teamId: requireEnv("VERCEL_TEAM_ID"),
    projectId: requireEnv("VERCEL_PROJECT_ID"),
    token: requireEnv("VERCEL_TOKEN"),
  };
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} in the Convex environment.`);
  return value;
}
