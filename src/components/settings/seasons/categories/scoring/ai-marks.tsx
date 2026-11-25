"use client";

import { createContext, use, type ReactNode } from "react";

import type { MarkKey } from "./form-diff";

const AiMarksContext = createContext<ReadonlySet<MarkKey>>(new Set());

export const AiMarksProvider = AiMarksContext.Provider;

/** Outlines a builder part the AI set, until an admin edits it. */
export function AiMark({ name, children }: { name: MarkKey; children: ReactNode }) {
  const isMarked = use(AiMarksContext).has(name);
  return (
    <div className="relative min-w-0">
      {isMarked ? (
        <>
          <span aria-hidden className="ai-mark-ring" />
          <span className="ai-mark-badge">
            AI<span className="sr-only"> set this field</span>
          </span>
        </>
      ) : null}
      {children}
    </div>
  );
}
