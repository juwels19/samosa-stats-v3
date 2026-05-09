"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/routes";
import { UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";

export default function AuthButtons() {
  return (
    <div className="flex gap-1 items-center">
      <AuthLoading>
        <Skeleton className="size-7 rounded-full" />
      </AuthLoading>
      <Unauthenticated>
        <Button asChild>
          <Link href={ROUTES.SIGN_IN}>Sign in</Link>
        </Button>
      </Unauthenticated>
      <Authenticated>
        <UserButton />
      </Authenticated>
    </div>
  );
}
