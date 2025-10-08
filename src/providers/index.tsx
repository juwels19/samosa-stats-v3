import ClerkProvider from "@/providers/clerk-provider";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}
