import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Sans } from "next/font/google";
import Providers from "@/providers";
import TopNav from "@/components/navigation/top-nav";
import BottomNav from "@/components/navigation/bottom-nav";
import { cn } from "@/lib/utils";

import "./globals.css";

const instrumentSansHeading = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | v3 Samosa Stats",
    default: "v3 Samosa Stats",
  },
  description: "Degenerate FRC fantasy",
  appleWebApp: {
    capable: true,
    title: "Samosa Stats",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-CA"
      suppressHydrationWarning
      className={cn(
        instrumentSansHeading.variable,
        geistSans.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-dvh antialiased">
        <Providers>
          <TopNav />
          <main className="mx-auto w-full max-w-screen-2xl pb-(--bottom-nav-height)">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
