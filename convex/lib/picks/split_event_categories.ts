import type { Doc } from "../../_generated/dataModel";
import { sortCategoriesByText } from "../events/sort";

export function splitEventCategories(categories: Doc<"categories">[]) {
  const globalCategories = sortCategoriesByText(
    categories.filter((category) => category.isGlobal),
  );
  const selectableCategories = sortCategoriesByText(
    categories.filter((category) => !category.isGlobal),
  );

  return {
    globalCategories,
    selectableCategories,
  };
}
