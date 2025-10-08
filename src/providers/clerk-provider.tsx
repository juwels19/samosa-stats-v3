import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

export default function ClerkProvider({ children }: { children: ReactNode }) {
  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
