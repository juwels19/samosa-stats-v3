import { Card } from "@heroui/react";
import { DotmCircular3 } from "@/components/common/dotmatrix/dotm-circular-3";
import CustomWaitlistForm from "@/components/waitlist/custom-waitlist-form";
import WaitlistAccessCheck from "@/components/waitlist/waitlist-access-check";
import { getCurrentUserFromSession } from "@/lib/admin";
import { ROUTES } from "@/lib/routes";
import { auth } from "@clerk/nextjs/server";
import { CircleCheckIcon } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Join Waitlist",
  description: "Join the Samosa Stats waitlist",
};

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const paramsPromise: Promise<{ status?: string }> =
    searchParams ?? Promise.resolve({});
  const [session, currentUser, params] = await Promise.all([
    auth(),
    getCurrentUserFromSession(),
    paramsPromise,
  ]);

  if (currentUser?.isApproved || currentUser?.isAdmin) {
    redirect(ROUTES.DASHBOARD);
  }

  const isInvited = params.status === "invited";
  const isPending = Boolean(session.userId) || params.status === "pending";

  return (
    <div className="flex w-full justify-center px-4 pt-6 pb-10 sm:px-6 sm:pt-12">
      {isInvited ? (
        <InvitedWaitlistState />
      ) : isPending ? (
        <PendingWaitlistState />
      ) : (
        <CustomWaitlistForm />
      )}
    </div>
  );
}

function InvitedWaitlistState() {
  return (
    <Card className="w-full max-w-xl items-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CircleCheckIcon className="size-7" aria-hidden="true" />
      </div>
      <Card.Header className="items-center">
        <Card.Title className="font-heading text-2xl font-semibold">
          Welcome to the degeneracy!
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p className="max-w-md text-sm/relaxed text-muted">
          Your request is approved. Open the invitation email from Samosa
          Stats, then follow its link to accept your invite.
        </p>
      </Card.Content>
    </Card>
  );
}

function PendingWaitlistState() {
  return (
    <Card className="w-full max-w-xl items-center gap-4 text-center">
      <DotmCircular3
        ariaLabel="Application under review"
        size={56}
        dotSize={6}
      />
      <Card.Header className="items-center">
        <Card.Title className="font-heading text-2xl font-semibold">
          You&apos;re under review
        </Card.Title>
      </Card.Header>
      <Card.Content className="flex w-full flex-col items-center gap-6">
        <p className="max-w-md text-sm/relaxed text-muted">
          We received your waitlist request. You&apos;ll get an invite when
          your account is approved. That invite unlocks sign in for your email.
        </p>
        <WaitlistAccessCheck />
      </Card.Content>
    </Card>
  );
}
