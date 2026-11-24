"use client";

import { Skeleton } from "@heroui/react";
import { useQuery } from "convex/react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "../../../../../../convex/_generated/api";
import CategoryScoringForm from "./category-scoring-form";

/** Scoring setup for one category: winner config, checks and preview. */
export default function CategoryScoringEditor({
  categoryId,
}: {
  categoryId: string;
}) {
  const currentUser = useCurrentUser();
  const data = useQuery(
    api.categories.get,
    currentUser.user?.isAdmin ? { categoryId } : "skip",
  );

  if (
    currentUser.isLoading ||
    (currentUser.user?.isAdmin && data === undefined)
  ) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!currentUser.user?.isAdmin) {
    return (
      <p className="text-sm text-muted">
        You must be an admin to manage categories.
      </p>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted">Category not found.</p>;
  }

  return (
    <CategoryScoringForm
      key={data.category._id}
      category={data.category}
      season={data.season}
    />
  );
}
