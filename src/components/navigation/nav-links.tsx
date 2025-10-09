"use client";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { usePathname } from "next/navigation";
import { adminMenuItems } from "@/components/navigation/constants";

export default function NavLinks() {
  const pathname = usePathname();

  const { isAuthenticated } = useConvexAuth();

  const currentUser = useQuery(api.users.current);
  const isAdmin = currentUser?.isAdmin || false;

  return (
    <NavigationMenu className="hidden md:block">
      <NavigationMenuList>
        <NavigationMenuLink
          asChild
          className={navigationMenuTriggerStyle()}
          data-active={pathname ? pathname === "/dashboard" : false}
        >
          <Link href="/dashboard">Dashboard</Link>
        </NavigationMenuLink>
        {isAuthenticated && isAdmin && (
          <>
            {adminMenuItems.map((item) => (
              <NavigationMenuLink
                key={`admin-menu-item-${item.label}`}
                className={navigationMenuTriggerStyle()}
                active={pathname ? pathname === item.href : false}
                asChild
              >
                <Link href={item.href}>{item.label}</Link>
              </NavigationMenuLink>
            ))}
          </>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
