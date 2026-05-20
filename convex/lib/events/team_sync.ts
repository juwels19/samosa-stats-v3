import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import type { EventStatus } from "./types";

export type EventTeamInput = {
  name: string;
  number: number;
};

export async function syncEventTeams(
  ctx: MutationCtx,
  eventId: Id<"events">,
  teams: EventTeamInput[],
) {
  const normalizedTeams = normalizeTeams(teams);
  const syncedTeamIds = new Set<Id<"teams">>();

  for (const team of normalizedTeams) {
    const teamNumber = BigInt(team.number);
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("byNumber", (q) => q.eq("number", teamNumber))
      .first();
    const teamId =
      existingTeam === null
        ? await ctx.db.insert("teams", {
            name: team.name,
            number: teamNumber,
          })
        : existingTeam._id;

    if (existingTeam !== null && existingTeam.name !== team.name) {
      await ctx.db.patch(teamId, {
        name: team.name,
      });
    }

    syncedTeamIds.add(teamId);

    const existingEventTeam = await ctx.db
      .query("eventTeams")
      .withIndex("byEventAndTeam", (q) =>
        q.eq("event", eventId).eq("team", teamId),
      )
      .unique();

    if (existingEventTeam === null) {
      await ctx.db.insert("eventTeams", {
        event: eventId,
        team: teamId,
      });
    }
  }

  const existingEventTeams = await ctx.db
    .query("eventTeams")
    .withIndex("byEvent", (q) => q.eq("event", eventId))
    .collect();

  for (const eventTeam of existingEventTeams) {
    if (!syncedTeamIds.has(eventTeam.team)) {
      await ctx.db.delete(eventTeam._id);
    }
  }

  return {
    savedTeamCount: normalizedTeams.length,
  };
}

export function canRefreshTeamsForEvent(status: EventStatus) {
  return status === "UPCOMING" || status === "SUBMISSIONS_OPEN";
}

function normalizeTeams(teams: EventTeamInput[]) {
  const teamsByNumber = new Map<number, string>();

  for (const team of teams) {
    if (!Number.isSafeInteger(team.number) || team.number <= 0) {
      throw new Error("Team numbers must be positive whole numbers.");
    }

    if (teamsByNumber.has(team.number)) {
      continue;
    }

    const name = team.name.trim();
    teamsByNumber.set(
      team.number,
      name.length > 0 ? name : `Team ${team.number}`,
    );
  }

  return [...teamsByNumber.entries()]
    .map(([number, name]) => ({ name, number }))
    .toSorted((a, b) => a.number - b.number);
}
