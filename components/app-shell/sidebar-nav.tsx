"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
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
import { ROLE_LABEL, type NavItem } from "./nav-config";
import type { UserRole } from "@/lib/supabase/types";

export function AppSidebar({ items, role }: { items: NavItem[]; role: UserRole }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="none" className="hidden md:flex">
      <SidebarHeader className="flex-row items-center gap-2 px-4 py-4">
        <GraduationCap className="size-6 text-primary" />
        <div className="flex flex-col leading-tight">
          <span className="font-semibold">Halaqa Academy</span>
          <span className="text-xs text-muted-foreground">{ROLE_LABEL[role]} Portal</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={active}>
                      <item.icon />
                      <span>{item.label}</span>
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
