"use client";

import { Button, buttonVariants, Input } from "@heroui/react";
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
    <div className="flex w-full max-w-sm flex-col gap-3 text-left">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          type="email"
          name="email"
          value={email}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          aria-label="Email address"
          className="min-h-11 min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" className="min-h-11">
          Check
        </Button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3">
        {canCheckEmail && accessStatus === undefined ? (
          <p className="text-sm text-muted">Checking access...</p>
        ) : null}

        {accessStatus?.canSignIn ? (
          <div className="flex flex-col gap-2 rounded-3xl border border-border bg-surface p-4 text-sm">
            <p className="font-medium">You have access.</p>
            <p className="text-muted">
              Your invite is ready. Sign in with this email to continue.
            </p>
            <Link
              href={ROUTES.SIGN_IN}
              className={buttonVariants({ size: "lg", fullWidth: true })}
            >
              Sign in
            </Link>
          </div>
        ) : null}

        {accessStatus && !accessStatus.canSignIn ? (
          <p className="text-sm text-muted">
            {getStatusMessage(accessStatus.status)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
