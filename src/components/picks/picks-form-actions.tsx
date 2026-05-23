import { Button } from "@/components/ui/button";

export default function PicksFormActions({
  canRandomize,
  canReview,
  reviewLabel,
  isSubmitting,
  onRandomize,
  onReview,
}: {
  canRandomize: boolean;
  canReview: boolean;
  reviewLabel: string;
  isSubmitting: boolean;
  onRandomize: () => void;
  onReview: () => void;
}) {
  return (
    <div className="h-full grid grid-cols-2 gap-2 items-center sm:flex sm:justify-end">
      <Button
        type="button"
        variant="secondary"
        disabled={!canRandomize || isSubmitting}
        onClick={onRandomize}
      >
        I&apos;m feeling lucky
      </Button>
      <Button
        type="button"
        disabled={!canReview || isSubmitting}
        onClick={onReview}
      >
        {reviewLabel}
      </Button>
    </div>
  );
}
