"use client";

import { Button, Modal, Spinner } from "@heroui/react";
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
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable={!isSubmitting}
    >
      <Modal.Container placement="auto" scroll="inside">
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Confirm your picks</Modal.Heading>
            <p className="text-sm text-muted">
              Check your picks before you submit.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            {isRandomPick ? <PicksRandomSubmitBanner /> : null}
            <PicksSummaryContent
              selectedTeams={selectedTeams}
              selectedCategories={selectedCategories}
              displayName={displayName}
            />
          </Modal.Body>
          <Modal.Footer className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              variant="secondary"
              size="lg"
              isDisabled={isSubmitting}
              onPress={() => onOpenChange(false)}
            >
              Back
            </Button>
            <Button
              size="lg"
              isPending={isSubmitting}
              onPress={() => void onConfirm()}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? "Submitting" : submitLabel}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
