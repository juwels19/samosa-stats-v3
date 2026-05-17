"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuery } from "convex/react";
import { CalendarDaysIcon, Globe2Icon } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import CreateCategory from "./create-category";
import CategoriesEmptyState from "./categories-empty";
import CategoryGroup from "@/components/settings/seasons/categories/category-group";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesList() {
  const currentUser = useCurrentUser();
  const categoryData = useQuery(
    api.categories.list,
    currentUser.user?.isAdmin ? {} : "skip",
  );
  const totalCategories =
    (categoryData?.globalCategories.length ?? 0) +
    (categoryData?.seasonCategories.length ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>
          Manage category options. Locked after creation.
        </CardDescription>
        <CardAction>
          <CreateCategory
            hasActiveSeason={categoryData?.activeSeason != null}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {currentUser.isLoading || categoryData === undefined ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : !currentUser.user?.isAdmin ? (
          <div className="text-sm text-muted-foreground">
            Admin access is required to manage categories.
          </div>
        ) : totalCategories === 0 ? (
          <CategoriesEmptyState />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryGroup
              title="Global"
              description="Shared options for the active setup."
              icon={Globe2Icon}
              categories={categoryData.globalCategories}
              emptyTitle="No global options"
              emptyDescription="Add one and mark it as global."
            />
            <CategoryGroup
              title="Active season"
              description={
                categoryData.activeSeason
                  ? `Available for ${categoryData.activeSeason.gameName}.`
                  : "Choose an active year before adding options."
              }
              icon={CalendarDaysIcon}
              categories={categoryData.seasonCategories}
              emptyTitle="No active options"
              emptyDescription="Add one without marking it global."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
