"use client";

import { createContext, useContext } from "react";

export type MultiStepModalContextValue<TData extends object> = {
  data: TData;
  direction: "forward" | "backward";
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (stepIndex: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetSteps: () => void;
  setData: (data: TData) => void;
  updateData: (data: Partial<TData>) => void;
};

export const MultiStepModalContext = createContext<unknown | null>(null);

export function useMultiStepModal<TData extends object>() {
  const context = useContext(MultiStepModalContext);

  if (context === null) {
    throw new Error(
      "useMultiStepModal must be used within a MultiStepModalProvider.",
    );
  }

  return context as MultiStepModalContextValue<TData>;
}
