"use client";

import { settingsSidebarItems } from "@/components/settings/sidebar/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsSidebar() {
  const pathname = usePathname();
  return (
    <div className="w-44 flex flex-col items-center">
      {settingsSidebarItems.map((group) => (
        <div
          key={`settings-sidebar-group-${group.label}`}
          className="flex flex-col gap-0.5"
        >
          <p className="text-xs text-muted-foreground ml-2">{group.label}</p>
          {group.items.map((item) => (
            <Link
              key={`settings-sidebar-group-${group.label}-${item.label}`}
              href={item.href}
              className="px-2 py-1 flex gap-2 items-center justify-start text-sm  rounded-md hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[active=true]:bg-accent data-[active=true]:dark:bg-accent/50"
              data-active={pathname === item.href}
            >
              {<item.icon className="size-4 text-muted-foreground" />}
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
