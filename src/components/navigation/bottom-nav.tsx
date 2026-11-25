"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "./constants";
import { useNavItems } from "./use-nav-items";

/** Tab bar for phones. Signed-in users only, not on the root page. Hidden from the md breakpoint up. */
export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, items } = useNavItems();

  if (!isAuthenticated || pathname === ROUTES.HOME) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-separator bg-background/90 pb-safe backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted transition-colors active:scale-95",
                  active && "text-accent",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
