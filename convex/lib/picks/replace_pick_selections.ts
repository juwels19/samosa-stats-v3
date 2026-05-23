import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

export async function replacePickSelections(
  ctx: MutationCtx,
  {
    pickId,
    teamIds,
    categoryIds,
  }: {
    pickId: Id<"picks">;
    teamIds: Id<"teams">[];
    categoryIds: Id<"categories">[];
  },
) {
  const [existingTeams, existingCategories] = await Promise.all([
    ctx.db
      .query("pickTeams")
      .withIndex("byPick", (q) => q.eq("pick", pickId))
      .collect(),
    ctx.db
      .query("pickCategories")
      .withIndex("byPick", (q) => q.eq("pick", pickId))
      .collect(),
  ]);

  await Promise.all([
    ...existingTeams.map(
      async (pickTeam) => await ctx.db.delete(pickTeam._id),
    ),
    ...existingCategories.map(
      async (pickCategory) => await ctx.db.delete(pickCategory._id),
    ),
  ]);

  await Promise.all([
    ...teamIds.map(
      async (teamId) =>
        await ctx.db.insert("pickTeams", {
          pick: pickId,
          team: teamId,
        }),
    ),
    ...categoryIds.map(
      async (categoryId) =>
        await ctx.db.insert("pickCategories", {
          pick: pickId,
          category: categoryId,
        }),
    ),
  ]);
}
