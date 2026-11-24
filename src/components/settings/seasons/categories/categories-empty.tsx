import EmptyState from "@/components/common/empty-state";
import { TagsIcon } from "lucide-react";

export default function CategoriesEmptyState() {
  return <EmptyState icon={<TagsIcon />} title="No categories yet" />;
}
