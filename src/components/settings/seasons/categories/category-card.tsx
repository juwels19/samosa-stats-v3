import { Item, ItemMedia, ItemContent, ItemTitle } from "@/components/ui/item";
import { TagsIcon } from "lucide-react";
import { Doc } from "../../../../../convex/_generated/dataModel";

export default function CategoryCard({
  category,
}: {
  category: Doc<"categories">;
}) {
  return (
    <Item
      role="listitem"
      variant="outline"
      size="sm"
      className="rounded-3xl bg-card shadow-sm hover:bg-muted/30"
    >
      <ItemContent className="min-w-0">
        <ItemTitle>{category.text}</ItemTitle>
      </ItemContent>
    </Item>
  );
}
