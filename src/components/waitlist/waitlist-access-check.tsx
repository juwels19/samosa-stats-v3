"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStatusMessage } from "@/components/waitlist/get-status-message";
import { ROUTES } from "@/lib/routes";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "../../../convex/_generated/api";

export default function WaitlistAccessCheck() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const normalizedEmail = submittedEmail.trim().toLowerCase();
  const canCheckEmail = normalizedEmail.includes("@");
  const accessStatus = useQuery(
    api.users.accessStatusByEmail,
    canCheckEmail ? { email: normalizedEmail } : "skip",
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedEmail(email);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          type="email"
          name="email"
          value={email}
          placeholder="you@example.com"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          aria-label="Email address"
        />
        <Button type="submit" variant="outline">
          Check
        </Button>
      </form>

      {canCheckEmail && accessStatus === undefined ? (
        <p className="text-sm text-muted-foreground">Checking access...</p>
      ) : null}

      {accessStatus?.canSignIn ? (
        <div className="flex flex-col gap-2 rounded-3xl border bg-card p-4 text-sm">
          <p className="font-medium">You have access.</p>
          <p className="text-muted-foreground">
            Your invite is ready. Sign in with this email to continue.
          </p>
          <Button asChild>
            <Link href={ROUTES.SIGN_IN}>Sign in</Link>
          </Button>
        </div>
      ) : null}

      {accessStatus && !accessStatus.canSignIn ? (
        <p className="text-sm text-muted-foreground">
          {getStatusMessage(accessStatus.status)}
        </p>
      ) : null}
    </div>
  );
}
