import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DotmCircular3 } from "@/components/ui/dotm-circular-3";
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
    <div className="flex min-h-full items-center justify-center px-4 py-10">
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
    <Card className="w-full max-w-xl">
      <CardHeader className="items-center justify-items-center text-center">
        <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleCheckIcon className="size-7" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl">Welcome to the degeneracy!</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <p className="max-w-md text-sm/relaxed text-muted-foreground">
          Your request has been approved. Check your email for the invitation
          from Samosa Stats, then follow that link to complete accepting your
          invite.
        </p>
      </CardContent>
    </Card>
  );
}

function PendingWaitlistState() {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="items-center justify-items-center text-center">
        <DotmCircular3
          ariaLabel="Application under review"
          size={56}
          dotSize={6}
          className="mb-2 justify-self-center"
        />
        <CardTitle className="text-2xl">You&apos;re under review</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <p className="max-w-md text-sm/relaxed text-muted-foreground">
          We received your waitlist request. You&apos;ll get an invite when your
          account is approved, and that invite will unlock sign in for your
          email.
        </p>
        <WaitlistAccessCheck />
      </CardContent>
    </Card>
  );
}
