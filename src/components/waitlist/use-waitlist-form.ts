"use client";

import { ROUTES } from "@/lib/routes";
import { useWaitlist } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "../../../convex/_generated/api";

export function useWaitlistForm() {
  const router = useRouter();
  const convex = useConvex();
  const { waitlist, errors, fetchStatus } = useWaitlist();
  const [emailAddress, setEmailAddress] = useState("");
  const [isCheckingWaitlist, setIsCheckingWaitlist] = useState(false);
  const isSubmitting = fetchStatus === "fetching" || isCheckingWaitlist;
  const emailError = errors.fields.emailAddress?.longMessage;
  const formError = errors.global?.[0]?.longMessage;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmailAddress = emailAddress.trim();

    setIsCheckingWaitlist(true);
    const waitlistStatus = await convex
      .query(api.users.waitlistStatusByEmail, {
        email: trimmedEmailAddress,
      })
      .finally(() => setIsCheckingWaitlist(false));

    if (waitlistStatus !== "not_found") {
      const nextStatus =
        waitlistStatus === "invited" ||
        waitlistStatus === "completed" ||
        waitlistStatus === "approved"
          ? "invited"
          : "pending";

      router.replace(`${ROUTES.WAITLIST}?status=${nextStatus}`);
      return;
    }

    const { error } = await waitlist.join({
      emailAddress: trimmedEmailAddress,
    });

    if (!error) {
      router.replace(`${ROUTES.WAITLIST}?status=pending`);
    }
  }

  return {
    emailAddress,
    emailError,
    formError,
    handleSubmit,
    isSubmitting,
    setEmailAddress,
  };
}
