"use client";

import {
  adminMenuItems,
  generalMenuItems,
} from "@/components/navigation/constants";
import HomeIconLink from "@/components/navigation/home-icon-link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useConvexAuth, useQuery } from "convex/react";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";

export default function NavSideSheet() {
  const { isAuthenticated } = useConvexAuth();

  const currentUser = useQuery(api.users.current);
  const isAdmin = currentUser?.isAdmin || false;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[250px]">
        <SheetHeader>
          <SheetTitle className="max-w-max">
            <HomeIconLink />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Samosa stats mobile nav menu
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          {generalMenuItems.map((item) => (
            <Link
              key={`mobile-general-menu-item-${item.label}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated &&
            isAdmin &&
            adminMenuItems.map((item) => (
              <Link
                key={`mobile-admin-menu-item-${item.label}`}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
