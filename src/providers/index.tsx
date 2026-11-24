"use client";

import ClerkProvider from "@/providers/clerk-provider";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toast } from "@heroui/react";
import { ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ClerkProvider>
          <ConvexClientProvider>
            {children}
            <Toast.Provider placement="top" />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </ConvexClientProvider>
        </ClerkProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
