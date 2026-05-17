"use client";

import { settingsSidebarItems } from "@/components/settings/sidebar/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="none" className="bg-transparent">
      <SidebarContent className="py-6">
        {settingsSidebarItems.map((group) => (
          <SidebarGroup key={`settings-sidebar-group-${group.label}`}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem
                    key={`settings-sidebar-group-${group.label}-${item.label}`}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
