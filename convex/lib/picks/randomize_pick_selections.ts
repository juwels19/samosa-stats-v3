import type { Id, TableNames } from "../../_generated/dataModel";

export function randomizePickSelections<TTableName extends TableNames>({
  ids,
  count,
}: {
  ids: Id<TTableName>[];
  count: number;
}) {
  return sampleIdsWithoutReplacement(ids, count);
}

function sampleIdsWithoutReplacement<TTableName extends TableNames>(
  ids: Id<TTableName>[],
  count: number,
) {
  return ids
    .map((id) => ({ id, sort: Math.random() }))
    .toSorted((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(({ id }) => id);
}

export function randomizeIsRandom() {
  return Math.random() >= 0.5
}
