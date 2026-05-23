"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  PickSubmissionCategory,
  PickSubmissionTeam,
} from "./pick-submission-types";
import PicksRandomSubmitBanner from "./picks-random-submit-banner";
import PicksSummaryContent from "./picks-summary-content";

export default function PicksConfirmationDialog({
  open,
  onOpenChange,
  isRandomPick,
  selectedTeams,
  selectedCategories,
  displayName,
  submitLabel,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRandomPick: boolean;
  selectedTeams: PickSubmissionTeam[];
  selectedCategories: PickSubmissionCategory[];
  displayName: string;
  submitLabel: string;
  isSubmitting: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm your picks</DialogTitle>
          <DialogDescription>
            Review your selections before submitting.
          </DialogDescription>
        </DialogHeader>
        {isRandomPick ? <PicksRandomSubmitBanner /> : null}
        <PicksSummaryContent
          selectedTeams={selectedTeams}
          selectedCategories={selectedCategories}
          displayName={displayName}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
