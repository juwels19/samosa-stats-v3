"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/routes";
import { UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthButtons() {
  const pathname = usePathname();
  const showWaitlistButton = !pathname.startsWith(ROUTES.SIGN_IN);

  return (
    <div className="flex gap-1 items-center">
      <AuthLoading>
        <Skeleton className="size-7 rounded-full" />
      </AuthLoading>
      <Unauthenticated>
        <Button asChild variant="ghost">
          <Link href={ROUTES.SIGN_IN}>Sign in</Link>
        </Button>
        {showWaitlistButton ? (
          <Button asChild>
            <Link href={ROUTES.WAITLIST}>Join waitlist</Link>
          </Button>
        ) : null}
      </Unauthenticated>
      <Authenticated>
        <UserButton />
      </Authenticated>
    </div>
  );
}
