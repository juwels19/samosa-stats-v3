import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TagsIcon } from "lucide-react";

export default function CategoriesEmptyState() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TagsIcon />
        </EmptyMedia>
        <EmptyTitle>No categories yet</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
