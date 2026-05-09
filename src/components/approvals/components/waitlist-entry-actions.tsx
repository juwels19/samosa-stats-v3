"use client";

import type { WaitlistEntryAction } from "@/components/approvals/types";
import { Button } from "@/components/ui/button";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";
import { useActionState } from "react";
import { toast } from "sonner";

export default function WaitlistEntryActions({
  entry,
  inviteAction,
  revokeAction,
}: {
  entry: SerializedWaitlistEntry;
  inviteAction: WaitlistEntryAction;
  revokeAction: WaitlistEntryAction;
}) {
  const [, inviteFormAction, invitePending] = useActionState(
    async (_state: null, formData: FormData) => {
      await inviteAction(formData);
      toast.success("Invitation sent", {
        description: `${entry.emailAddress} has been invited to the app.`,
      });
      return null;
    },
    null,
  );
  const [, revokeFormAction, revokePending] = useActionState(
    async (_state: null, formData: FormData) => {
      await revokeAction(formData);
      toast.success("Access revoked", {
        description: `${entry.emailAddress} has been removed from the waitlist.`,
      });
      return null;
    },
    null,
  );
  const inviteDisabled =
    entry.status === "invited" || entry.status === "completed";
  const revokeDisabled =
    entry.status === "rejected" || entry.status === "completed";

  return (
    <div className="flex justify-end gap-2">
      <form action={inviteFormAction}>
        <input type="hidden" name="entryId" value={entry.id} />
        <input type="hidden" name="email" value={entry.emailAddress} />
        <WaitlistActionButton disabled={inviteDisabled} pending={invitePending}>
          Invite
        </WaitlistActionButton>
      </form>
      <form action={revokeFormAction}>
        <input type="hidden" name="entryId" value={entry.id} />
        <input type="hidden" name="email" value={entry.emailAddress} />
        <WaitlistActionButton
          variant="destructive"
          disabled={revokeDisabled}
          pending={revokePending}
        >
          Revoke
        </WaitlistActionButton>
      </form>
    </div>
  );
}

function WaitlistActionButton({
  children,
  disabled,
  pending,
  variant = "default",
}: {
  children: string;
  disabled: boolean;
  pending: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      disabled={disabled || pending}
      className="relative min-w-20"
      aria-label={pending ? `${children} pending` : children}
    >
      <span className={pending ? "invisible" : undefined}>{children}</span>
      {pending && (
        <DotMatrixLoader
          label={`${children} pending`}
          className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-current"
        />
      )}
    </Button>
  );
}
