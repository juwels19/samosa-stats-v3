"use client";

import { buttonVariants, SearchField, Skeleton } from "@heroui/react";
import { useQuery } from "convex/react";
import { Globe2Icon, SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { api } from "../../../../../convex/_generated/api";
import CategoriesEmptyState from "./categories-empty";
import CreateCategory from "./create-category";
import ImportCategories from "./import-categories";
import WinnerSourceChip from "./scoring/winner-source-chip";

type Scope = "all" | "global" | "season";

export default function CategoriesList() {
  const currentUser = useCurrentUser();
  const categoryData = useQuery(
    api.categories.list,
    currentUser.user?.isAdmin ? {} : "skip",
  );
  const [scope, setScope] = useState<Scope>("all");
  const [query, setQuery] = useState("");

  const globalCategories = categoryData?.globalCategories ?? [];
  const seasonCategories = categoryData?.seasonCategories ?? [];
  const all = [...globalCategories, ...seasonCategories];
  const seasonYear = categoryData?.activeSeason?.year;
  const q = query.trim().toLowerCase();
  const visible = all.filter(
    (c) =>
      (scope === "all" || (scope === "global") === c.isGlobal) &&
      (!q ||
        c.text.toLowerCase().includes(q) ||
        c.scoringDescription.toLowerCase().includes(q)),
  );

  const header = (
    <SettingsPageHeader
      title="Categories"
      description={
        categoryData?.activeSeason
          ? `${all.length} categories for ${categoryData.activeSeason.gameName}`
          : "Category options for picks"
      }
      action={
        currentUser.user?.isAdmin ? (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <ImportCategories
              hasActiveSeason={categoryData?.activeSeason != null}
              existingTexts={all.map((category) => category.text)}
            />
            <CreateCategory hasActiveSeason={categoryData?.activeSeason != null} />
          </div>
        ) : undefined
      }
    />
  );

  if (currentUser.isLoading || (currentUser.user?.isAdmin && categoryData === undefined)) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!currentUser.user?.isAdmin || !categoryData) {
    return <p className="text-sm text-muted">You must be an admin to manage categories.</p>;
  }

  if (all.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <CategoriesEmptyState />
      </div>
    );
  }

  const filters: [Scope, string][] = [
    ["all", `All ${all.length}`],
    ["global", `Global ${globalCategories.length}`],
    ["season", `Season ${seasonCategories.length}`],
  ];

  return (
    <div className="flex flex-col gap-5">
      {header}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div role="group" aria-label="Scope" className="flex gap-1 rounded-full bg-default p-1">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
              className={cn(
                "min-h-10 flex-1 rounded-full px-4 text-sm font-medium whitespace-nowrap text-muted transition-colors duration-150 ease-out sm:flex-none",
                scope === value && "bg-surface text-foreground shadow-sm",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <SearchField
          aria-label="Search categories"
          value={query}
          onChange={setQuery}
          className="sm:ml-auto sm:w-72"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search categories" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No categories match.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((category) => (
            <li key={category._id} className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-balance">{category.text}</h2>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    category.isGlobal
                      ? "bg-accent-soft text-accent-soft-foreground"
                      : "bg-default text-muted",
                  )}
                >
                  {category.isGlobal ? <Globe2Icon className="size-3" aria-hidden /> : null}
                  {category.isGlobal ? "Global" : (seasonYear ?? "Season")}
                </span>
              </div>
              <p className="text-sm leading-6 whitespace-pre-wrap text-muted">
                {category.scoringDescription}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                <WinnerSourceChip winnerSource={category.winnerSource} />
                <Link
                  href={`/settings/seasons/categories/${category._id}`}
                  className={buttonVariants({ size: "sm", variant: "secondary" })}
                >
                  <SlidersHorizontalIcon className="size-4" aria-hidden />
                  Scoring
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
