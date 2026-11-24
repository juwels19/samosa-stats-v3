"use client";

import { useEffect, useState } from "react";

/** Current time, updated every `intervalMs` while `enabled` is true. */
export function useNow({
  enabled = true,
  intervalMs = 1000,
}: { enabled?: boolean; intervalMs?: number } = {}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);

  return now;
}
