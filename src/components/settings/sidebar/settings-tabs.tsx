"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { aiTab, settingsTabs, testingTab, usersTab } from "./constants";

/** Underline tabs that stick under the top bar at every width. */
export default function SettingsTabs({
  isAdmin,
  showTesting,
}: {
  isAdmin: boolean;
  showTesting: boolean;
}) {
  const pathname = usePathname();
  const tabs = [
    ...settingsTabs,
    ...(isAdmin ? [usersTab, aiTab] : []),
    ...(showTesting ? [testingTab] : []),
  ];

  return (
    <div className="sticky top-(--nav-height) z-20 border-b border-separator bg-background/90 backdrop-blur-lg">
      <nav
        aria-label="Settings"
        className="mx-auto -mb-px flex max-w-5xl gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6"
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 shrink-0 items-center border-b-2 border-transparent text-sm font-medium whitespace-nowrap text-muted transition-colors duration-150 ease-out hover:text-foreground",
                active && "border-accent text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
