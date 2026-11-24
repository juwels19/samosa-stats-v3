"use client";

import { AlertDialog, Button, Dropdown, Label, Spinner, toast } from "@heroui/react";
import { EllipsisIcon, MailPlusIcon, UserXIcon } from "lucide-react";
import { useState, useTransition } from "react";
import type { WaitlistEntryAction } from "@/components/approvals/types";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";

function toFormData(entry: SerializedWaitlistEntry) {
  const formData = new FormData();
  formData.set("entryId", entry.id);
  formData.set("email", entry.emailAddress);
  return formData;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function WaitlistEntryActions({
  entry,
  inviteAction,
  revokeAction,
}: {
  entry: SerializedWaitlistEntry;
  inviteAction: WaitlistEntryAction;
  revokeAction: WaitlistEntryAction;
}) {
  const [invitePending, startInvite] = useTransition();
  const [revokePending, startRevoke] = useTransition();
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);

  const inviteDisabled =
    entry.status === "invited" || entry.status === "completed";
  const revokeDisabled =
    entry.status === "rejected" || entry.status === "completed";
  const busy = invitePending || revokePending;

  function handleInvite() {
    startInvite(async () => {
      try {
        await inviteAction(toFormData(entry));
        toast.success("Invitation sent", {
          description: `${entry.emailAddress} can now join the app.`,
        });
      } catch (error) {
        toast.danger(errorMessage(error, "Could not send the invitation."));
      }
    });
  }

  function handleRevoke() {
    startRevoke(async () => {
      try {
        await revokeAction(toFormData(entry));
        toast.success("Access revoked", {
          description: `${entry.emailAddress} was removed from the waitlist.`,
        });
        setConfirmRevokeOpen(false);
      } catch (error) {
        toast.danger(errorMessage(error, "Could not revoke access."));
      }
    });
  }

  const canInvite = !inviteDisabled;
  const canRevoke = !revokeDisabled;

  if (!canInvite && !canRevoke) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {canInvite ? (
        <Button
          size="sm"
          className="min-h-10 px-4 lg:min-h-9"
          isDisabled={busy}
          isPending={invitePending}
          onPress={handleInvite}
        >
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <MailPlusIcon className="size-4" aria-hidden />
              )}
              Invite
            </>
          )}
        </Button>
      ) : null}
      {canRevoke ? (
        <Dropdown>
          <Button
            isIconOnly
            variant="ghost"
            className="size-10 lg:size-9"
            aria-label={`More actions for ${entry.emailAddress}`}
            isDisabled={busy}
            isPending={revokePending}
          >
            <EllipsisIcon className="size-5" />
          </Button>
          <Dropdown.Popover placement="bottom end" className="min-w-40">
            <Dropdown.Menu
              aria-label={`More actions for ${entry.emailAddress}`}
              onAction={(key) => {
                if (key === "revoke") setConfirmRevokeOpen(true);
              }}
            >
              <Dropdown.Item id="revoke" textValue="Revoke" variant="danger">
                <UserXIcon className="size-4 shrink-0" aria-hidden />
                <Label>Revoke</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      ) : null}

      <AlertDialog.Backdrop
        isOpen={confirmRevokeOpen}
        onOpenChange={(open) => {
          if (!revokePending) setConfirmRevokeOpen(open);
        }}
      >
        <AlertDialog.Container placement="auto" size="sm">
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Revoke access?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-muted">
                <span className="font-medium break-all text-foreground">
                  {entry.emailAddress}
                </span>{" "}
                will be removed from the waitlist and cannot sign in.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="secondary"
                size="lg"
                isDisabled={revokePending}
                onPress={() => setConfirmRevokeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="lg"
                isPending={revokePending}
                onPress={handleRevoke}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    Revoke
                  </>
                )}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
