"use client";

import { ReactNode } from "react";

import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

import { useMultiStepModal } from "./use-multi-step-modal";

type MultiStepModalStep = {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
};

type MultiStepModalProps = {
  title: string;
  description?: string;
  steps: MultiStepModalStep[];
  footer: ReactNode;
};

export default function MultiStepModal({
  title,
  description,
  steps,
  footer,
}: MultiStepModalProps) {
  const { currentStepIndex, direction } = useMultiStepModal<object>();
  const currentStep = steps[currentStepIndex];

  return (
    <AlertDialogContent className="sm:max-w-2xl">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && (
          <AlertDialogDescription>{description}</AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              data-active={index === currentStepIndex}
              data-complete={index < currentStepIndex}
              className={cn(
                "rounded-2xl border bg-secondary/40 p-3 text-sm transition-colors",
                "data-[complete=true]:border-success/30 data-[complete=true]:bg-success/10",
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                <span
                  data-active={index === currentStepIndex}
                  data-complete={index < currentStepIndex}
                  className={cn(
                    "flex size-6 shrink-0 items-center bg-secondary justify-center rounded-full text-sm text-secondary-foreground transition-colors",
                    "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                    "data-[complete=true]:bg-transparent",
                  )}
                >
                  {index < currentStepIndex ? <CheckIcon /> : index + 1}
                </span>
                <span>{step.title}</span>
              </div>
              {step.description && (
                <div className="mt-1 text-muted-foreground">
                  {step.description}
                </div>
              )}
            </div>
          ))}
        </div>
        {currentStep && (
          <div aria-live="polite" className="sr-only">
            {currentStep.title}
          </div>
        )}
        {currentStep && (
          <section
            key={currentStep.id}
            className={cn(
              "duration-300 animate-in fade-in-0",
              direction === "forward"
                ? "slide-in-from-right-8"
                : "slide-in-from-left-8",
            )}
          >
            {currentStep.content}
          </section>
        )}
      </div>
      <AlertDialogFooter>{footer}</AlertDialogFooter>
    </AlertDialogContent>
  );
}
