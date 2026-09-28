"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UnreadCounts } from "@/lib/notifications/counts";
import { getActiveHref, getNavItems, ROLE_LABEL } from "./nav-config";
import { UnreadBadge } from "./unread-badge";
import type { UserRole } from "@/lib/supabase/types";

export function AppSidebar({ role, unread }: { role: UserRole; unread: UnreadCounts }) {
  const pathname = usePathname();
  const items = getNavItems(role);
  const activeHref = getActiveHref(items, pathname);

  return (
    <Sidebar collapsible="none" className="hidden md:flex">
      <SidebarHeader className="flex-row items-center gap-2 px-4 py-4">
        <LogoMark className="size-8" />
        <div className="flex flex-col leading-tight">
          <span className="font-semibold">Mirqath Quran Academy</span>
          <span className="text-xs text-muted-foreground">{ROLE_LABEL[role]} Portal</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={active}>
                      <item.icon />
                      <span>{item.label}</span>
                      {item.badge && <UnreadBadge count={unread[item.badge]} className="ml-auto" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
