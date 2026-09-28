"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UnreadCounts } from "@/lib/notifications/counts";
import { arabicFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { getActiveHref, getNavItems, ROLE_LABEL } from "./nav-config";
import { UnreadBadge } from "./unread-badge";
import type { UserRole } from "@/lib/supabase/types";

export function AppSidebar({ role, unread }: { role: UserRole; unread: UnreadCounts }) {
  const pathname = usePathname();
  const items = getNavItems(role);
  const activeHref = getActiveHref(items, pathname);

  return (
    <Sidebar collapsible="none" className="sticky top-0 hidden h-svh border-r border-sidebar-border md:flex">
      <SidebarHeader className="px-5 pt-6 pb-4">
        <Link href={items[0]?.href ?? "/"} className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-[1.05rem] font-medium tracking-[-0.01em]">Mirqath</span>
            <span className="text-xs text-muted-foreground">Quran Academy</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground/80 uppercase">
            {ROLE_LABEL[role]} portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      className={cn(
                        "relative h-9 gap-3 rounded-lg px-3 text-[0.9rem] text-sidebar-foreground/75 hover:text-sidebar-foreground",
                        "data-active:bg-card data-active:font-medium data-active:text-sidebar-foreground data-active:shadow-soft",
                        "before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full before:bg-brass before:opacity-0 before:transition-opacity data-active:before:opacity-100"
                      )}
                    >
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
      <SidebarFooter className="px-5 pb-6">
        <p dir="rtl" lang="ar" className={cn(arabicFont.className, "text-right text-base leading-loose text-muted-foreground/70")}>
          وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
