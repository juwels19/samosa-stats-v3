"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import WaitlistAccessCheck from "@/components/waitlist/waitlist-access-check";
import { useWaitlistForm } from "@/components/waitlist/use-waitlist-form";

export default function CustomWaitlistForm() {
  const {
    emailAddress,
    emailError,
    formError,
    handleSubmit,
    isSubmitting,
    setEmailAddress,
  } = useWaitlistForm();

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="items-center justify-items-center text-center">
        <CardTitle className="text-2xl">Join the waitlist</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <p className="max-w-md text-sm/relaxed text-muted-foreground">
          Drop your email and we&apos;ll review your request. Approved users
          will receive an invite that unlocks sign in.
        </p>

        <form
          className="flex w-full max-w-sm flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <Field data-invalid={Boolean(emailError)}>
            <FieldLabel htmlFor="waitlist-email">Email address</FieldLabel>
            <Input
              id="waitlist-email"
              name="emailAddress"
              type="email"
              value={emailAddress}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError
                  ? "waitlist-email-error"
                  : "waitlist-email-description"
              }
              onChange={(event) => setEmailAddress(event.target.value)}
              className="h-10"
            />
            <FieldDescription id="waitlist-email-description">
              Use the same email you&apos;ll use to sign in after approval.
            </FieldDescription>
            {emailError ? (
              <FieldError id="waitlist-email-error">{emailError}</FieldError>
            ) : null}
          </Field>

          {formError ? <FieldError>{formError}</FieldError> : null}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Request access"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3 border-t text-center">
        <p className="text-sm text-muted-foreground">
          Already invited? Check your access below.
        </p>
        <WaitlistAccessCheck />
      </CardFooter>
    </Card>
  );
}
