"use client";

import { Button } from "@heroui/react";
import { ShuffleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sticky bar that holds the progress and the main actions. It sits on top
 * of the mobile tab bar, so the submit button is always in thumb reach.
 */
export default function PicksActionBar({
  teamCount,
  requiredTeamCount,
  categoryCount,
  requiredCategoryCount,
  canRandomize,
  canReview,
  reviewLabel,
  disabledReason,
  isSubmitting,
  onRandomize,
  onReview,
}: {
  teamCount: number;
  requiredTeamCount: number;
  categoryCount: number;
  requiredCategoryCount: number;
  canRandomize: boolean;
  canReview: boolean;
  reviewLabel: string;
  disabledReason: string | null;
  isSubmitting: boolean;
  onRandomize: () => void;
  onReview: () => void;
}) {
  return (
    <div className="sticky bottom-(--bottom-nav-height) z-30 -mx-4 border-t border-separator bg-background/90 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-2.5">
        <div className="flex items-center gap-4 text-xs font-medium text-muted">
          <ProgressDot
            label="Teams"
            count={teamCount}
            required={requiredTeamCount}
          />
          <ProgressDot
            label="Categories"
            count={categoryCount}
            required={requiredCategoryCount}
          />
          {disabledReason && !canReview ? (
            <span className="ml-auto hidden truncate sm:block">
              {disabledReason}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-2 sm:flex sm:justify-end">
          <Button
            variant="secondary"
            size="lg"
            isDisabled={!canRandomize || isSubmitting}
            onPress={onRandomize}
            aria-label="I'm feeling lucky: submit a random pick"
          >
            <ShuffleIcon className="size-4" />
            <span className="hidden min-[380px]:inline">Feeling lucky</span>
          </Button>
          <Button
            size="lg"
            isDisabled={!canReview || isSubmitting}
            onPress={onReview}
          >
            {reviewLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProgressDot({
  label,
  count,
  required,
}: {
  label: string;
  count: number;
  required: number;
}) {
  const complete = count === required;
  return (
    <span className="flex items-center gap-1.5 tabular-nums">
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full bg-border-tertiary transition-colors",
          complete && "bg-success",
        )}
      />
      {label} {count}/{required}
    </span>
  );
}
