"use client";

import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
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
    <Card className="w-full max-w-xl gap-6">
      <Card.Header className="items-center gap-2 text-center">
        <Card.Title className="font-heading text-2xl font-semibold">
          Join the waitlist
        </Card.Title>
        <Card.Description className="max-w-md text-sm/relaxed">
          Enter your email and we&apos;ll review your request. Approved users
          get an invite that unlocks sign in.
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex flex-col items-center">
        <form
          className="flex w-full max-w-sm flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <TextField
            fullWidth
            name="emailAddress"
            type="email"
            value={emailAddress}
            onChange={setEmailAddress}
            isRequired
            isDisabled={isSubmitting}
            isInvalid={Boolean(emailError)}
            validationBehavior="aria"
          >
            <Label>Email address</Label>
            <Input
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
            <Description>
              Use the same email you&apos;ll use to sign in after approval.
            </Description>
            <FieldError>{emailError}</FieldError>
          </TextField>

          {formError ? (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth isPending={isSubmitting}>
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : null}
                {isPending ? "Submitting" : "Request access"}
              </>
            )}
          </Button>
        </form>
      </Card.Content>

      <Card.Footer className="flex flex-col items-center gap-3 border-t border-separator pt-6 text-center">
        <p className="text-sm text-muted">
          Already invited? Check your access below.
        </p>
        <WaitlistAccessCheck />
      </Card.Footer>
    </Card>
  );
}
