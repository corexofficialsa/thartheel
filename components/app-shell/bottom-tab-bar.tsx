"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UnreadCounts } from "@/lib/notifications/counts";
import { getActiveHref, getNavItems } from "./nav-config";
import { UnreadBadge } from "./unread-badge";
import type { UserRole } from "@/lib/supabase/types";

export function BottomTabBar({ role, unread }: { role: UserRole; unread: UnreadCounts }) {
  const pathname = usePathname();
  const items = getNavItems(role);
  const activeHref = getActiveHref(items, pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-border/60 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = item.href === activeHref;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-w-[4.75rem] flex-1 shrink-0 flex-col items-center gap-1 px-1.5 pt-2.5 pb-2 text-[11px] font-medium whitespace-nowrap transition-colors",
              "before:absolute before:top-0 before:left-1/2 before:h-0.5 before:w-6 before:-translate-x-1/2 before:rounded-full before:bg-brass before:transition-opacity",
              active ? "text-foreground before:opacity-100" : "text-muted-foreground before:opacity-0"
            )}
          >
            <span className="relative">
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              {item.badge && <UnreadBadge count={unread[item.badge]} className="absolute -top-1.5 -right-2.5" />}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
