"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

export default function AuthButtons() {
  return (
    <div className="flex gap-1 items-center">
      <AuthLoading>
        <Skeleton className="size-7 rounded-full" />
      </AuthLoading>
      <Unauthenticated>
        <SignInButton mode="modal">
          <Button variant="ghost">Sign in</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button>Sign up</Button>
        </SignUpButton>
      </Unauthenticated>
      <Authenticated>
        <UserButton />
      </Authenticated>
    </div>
  );
}
