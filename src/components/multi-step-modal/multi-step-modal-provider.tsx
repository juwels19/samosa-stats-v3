"use client";

import { ReactNode, useCallback, useMemo, useState } from "react";

import {
  MultiStepModalContext,
  type MultiStepModalContextValue,
} from "./use-multi-step-modal";

type MultiStepModalProviderProps<TData extends object> = {
  children: ReactNode;
  initialData: TData;
  totalSteps: number;
};

export default function MultiStepModalProvider<TData extends object>({
  children,
  initialData,
  totalSteps,
}: MultiStepModalProviderProps<TData>) {
  const [data, setData] = useState<TData>(initialData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] =
    useState<MultiStepModalContextValue<TData>["direction"]>("forward");

  const goToStep = useCallback(
    (stepIndex: number) => {
      const nextStepIndex = Math.min(Math.max(stepIndex, 0), totalSteps - 1);

      setCurrentStepIndex((previousStepIndex) => {
        setDirection(
          nextStepIndex >= previousStepIndex ? "forward" : "backward",
        );
        return nextStepIndex;
      });
    },
    [totalSteps],
  );

  const goToNextStep = useCallback(() => {
    setDirection("forward");
    setCurrentStepIndex((stepIndex) =>
      Math.min(stepIndex + 1, totalSteps - 1),
    );
  }, [totalSteps]);

  const goToPreviousStep = useCallback(() => {
    setDirection("backward");
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0));
  }, []);

  const resetSteps = useCallback(() => {
    setData(initialData);
    setDirection("forward");
    setCurrentStepIndex(0);
  }, [initialData]);

  const updateData = useCallback((nextData: Partial<TData>) => {
    setData((currentData) => ({ ...currentData, ...nextData }));
  }, []);

  const value = useMemo<MultiStepModalContextValue<TData>>(
    () => ({
      data,
      direction,
      currentStepIndex,
      totalSteps,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === totalSteps - 1,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      resetSteps,
      setData,
      updateData,
    }),
    [
      currentStepIndex,
      data,
      direction,
      goToNextStep,
      goToPreviousStep,
      goToStep,
      resetSteps,
      totalSteps,
      updateData,
    ],
  );

  return (
    <MultiStepModalContext.Provider value={value}>
      {children}
    </MultiStepModalContext.Provider>
  );
}
