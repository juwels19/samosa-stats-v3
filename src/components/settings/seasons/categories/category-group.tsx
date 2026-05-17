import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { EmptyHeader } from "@/components/ui/empty";
import { ItemGroup } from "@/components/ui/item";
import { LucideIcon, TagsIcon } from "lucide-react";
import { Doc } from "../../../../../convex/_generated/dataModel";
import CategoryCard from "@/components/settings/seasons/categories/category-card";

export default function CategoryGroup({
  title,
  description,
  icon: Icon,
  categories,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  categories: Doc<"categories">[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="rounded-4xl border bg-background/60 p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Icon className="size-5" />
        </div>
        <div className="grow flex flex-row items-center justify-between">
          <div>
            <h2 className="font-heading font-medium">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {categories.length} categories
          </p>
        </div>
      </div>
      {categories.length === 0 ? (
        <Empty className="border bg-muted/20 p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TagsIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup className="max-h-96 overflow-y-auto">
          {categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </ItemGroup>
      )}
    </section>
  );
}
