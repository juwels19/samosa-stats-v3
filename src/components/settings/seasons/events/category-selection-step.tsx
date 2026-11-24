import type { Doc } from "../../../../../convex/_generated/dataModel";

import EventCategoryGroup from "./event-category-group";

export default function CategorySelectionStep({
  globalCategories,
  seasonCategories,
}: {
  globalCategories: Doc<"categories">[];
  seasonCategories: Doc<"categories">[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
      <EventCategoryGroup
        title="Global categories"
        categories={globalCategories}
      />
      <EventCategoryGroup
        title="Season categories"
        categories={seasonCategories}
      />
    </div>
  );
}
