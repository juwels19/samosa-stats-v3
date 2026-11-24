"use client";

import { buttonVariants, Skeleton } from "@heroui/react";
import { ROUTES } from "@/lib/routes";
import { UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";

export default function AuthButtons() {
  return (
    <div className="flex size-11 items-center justify-center has-[a]:w-auto">
      <AuthLoading>
        <Skeleton className="size-7 rounded-full" />
      </AuthLoading>
      <Unauthenticated>
        <Link href={ROUTES.SIGN_IN} className={buttonVariants({ size: "sm" })}>
          Sign in
        </Link>
      </Unauthenticated>
      <Authenticated>
        <UserButton />
      </Authenticated>
    </div>
  );
}
