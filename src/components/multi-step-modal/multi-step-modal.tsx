"use client";

import { Modal } from "@heroui/react";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useMultiStepModal } from "./use-multi-step-modal";

type MultiStepModalStep = {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
};

type MultiStepModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: MultiStepModalStep[];
  footer: ReactNode;
};

/**
 * Full screen on phones, a centred dialog from the sm breakpoint up.
 * The body scrolls and the footer stays pinned at the bottom, in thumb reach.
 */
export default function MultiStepModal({
  isOpen,
  onOpenChange,
  title,
  description,
  steps,
  footer,
}: MultiStepModalProps) {
  const { currentStepIndex, direction } = useMultiStepModal<object>();
  const currentStep = steps[currentStepIndex];
  const stepNumber = currentStepIndex + 1;

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
    >
      <Modal.Container
        size="lg"
        placement="auto"
        scroll="inside"
        className="p-0 sm:p-10"
      >
        <Modal.Dialog className="h-full max-h-full gap-0 rounded-none p-0 sm:h-auto sm:max-h-[min(48rem,calc(100dvh-5rem))] sm:max-w-2xl sm:rounded-[32px]">
          <Modal.CloseTrigger className="top-[calc(env(safe-area-inset-top)+1rem)] sm:top-4" />
          <Modal.Header className="shrink-0 gap-3 border-b border-separator px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4 sm:px-6 sm:pt-6">
            <div className="flex flex-col gap-1 pe-10">
              <Modal.Heading className="font-heading text-lg font-semibold">
                {title}
              </Modal.Heading>
              {description && (
                <p className="text-sm text-muted">{description}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{currentStep?.title}</span>
                <span className="text-muted tabular-nums">
                  Step {stepNumber} of {steps.length}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Progress"
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-valuenow={stepNumber}
                aria-valuetext={`Step ${stepNumber} of ${steps.length}`}
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                }}
              >
                {steps.map((step, index) => (
                  <span
                    key={step.id}
                    className={cn(
                      "h-1 rounded-full bg-default transition-colors duration-300",
                      index <= currentStepIndex && "bg-accent",
                    )}
                  />
                ))}
              </div>
              {currentStep?.description && (
                <p className="text-xs text-muted">{currentStep.description}</p>
              )}
            </div>
          </Modal.Header>
          <Modal.Body className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {currentStep && (
              <div aria-live="polite" className="sr-only">
                {`Step ${stepNumber} of ${steps.length}: ${currentStep.title}`}
              </div>
            )}
            {currentStep && (
              <section
                key={currentStep.id}
                className={cn(
                  "min-h-0 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none starting:opacity-0",
                  direction === "forward"
                    ? "starting:translate-x-6"
                    : "starting:-translate-x-6",
                )}
              >
                {currentStep.content}
              </section>
            )}
          </Modal.Body>
          <Modal.Footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-separator px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:flex sm:justify-end sm:px-6 sm:pb-6">
            {footer}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
