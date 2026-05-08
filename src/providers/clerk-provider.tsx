import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { ROUTES } from "@/lib/routes";
import { ReactNode } from "react";

export default function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <BaseClerkProvider signInUrl={ROUTES.SIGN_IN} waitlistUrl={ROUTES.WAITLIST}>
      {children}
    </BaseClerkProvider>
  );
}
