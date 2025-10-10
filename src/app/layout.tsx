import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/providers";
import TopNav from "@/components/navigation/top-nav";

import "./globals.css";

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
    template: "%s | Samosa Stats",
    default: "Samosa Stats",
  },
  description: "Degenerate FRC fantasy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-dvh`}
      >
        <Providers>
          <TopNav />
          <main className="font-geistSans max-w-screen-2xl mx-auto h-[calc(100dvh_-_var(--nav-height))]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
