"use client";

import { Button, Drawer } from "@heroui/react";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { adminMenuItems, isNavItemActive, type NavItem } from "./constants";
import { useNavItems } from "./use-nav-items";

/** Menu button and slide-out drawer for phones. Hidden from the md breakpoint up. */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { items } = useNavItems();
  const adminHrefs = new Set(adminMenuItems.map((item) => item.href));
  const general = items.filter((item) => !adminHrefs.has(item.href));
  const admin = items.filter((item) => adminHrefs.has(item.href));

  return (
    <>
      <Button
        isIconOnly
        variant="ghost"
        className="size-11 md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onPress={() => setOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>
      <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Menu</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="flex flex-col gap-6">
              <MenuGroup items={general} pathname={pathname} onNavigate={() => setOpen(false)} />
              {admin.length > 0 ? (
                <MenuGroup
                  title="Admin"
                  items={admin}
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              ) : null}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

function MenuGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav aria-label={title ?? "Main"} className="flex flex-col gap-1">
      {title ? (
        <h2 className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          {title}
        </h2>
      ) : null}
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors duration-150 ease-out active:bg-default",
              active ? "bg-accent-soft text-accent-soft-foreground" : "text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
