import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/admin";

export default async function ScoresLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</div>
  );
}
