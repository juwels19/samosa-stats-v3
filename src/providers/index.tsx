import ClerkProvider from "@/providers/clerk-provider";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkProvider>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
