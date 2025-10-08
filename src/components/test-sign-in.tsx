"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";

export default function TestSignIn() {
  return (
    <>
      <Unauthenticated>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </Unauthenticated>
      <Authenticated>
        <UserButton />
      </Authenticated>
    </>
  );
}
