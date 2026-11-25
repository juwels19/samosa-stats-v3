import { Chip } from "@heroui/react";

import type { UserRole } from "../../../../convex/lib/roles";
import { roleLabel } from "./constants";

const COLOR = { admin: "accent", approver: "success", player: "default" } as const;

export default function RoleChip({ role }: { role: UserRole }) {
  return (
    <Chip size="sm" variant="soft" color={COLOR[role]}>
      {roleLabel(role)}
    </Chip>
  );
}
