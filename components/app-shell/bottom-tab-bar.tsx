"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UnreadCounts } from "@/lib/notifications/counts";
import { getActiveHref, getNavItems, type NavItem } from "./nav-config";
import { UnreadBadge } from "./unread-badge";
import type { UserRole } from "@/lib/supabase/types";

const MAX_TABS = 5;

const tabClass = (active: boolean) =>
  cn(
    "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[11px] font-medium whitespace-nowrap transition-colors",
    "before:absolute before:top-0 before:left-1/2 before:h-0.5 before:w-6 before:-translate-x-1/2 before:rounded-full before:bg-brass before:transition-opacity",
    active ? "text-foreground before:opacity-100" : "text-muted-foreground before:opacity-0"
  );

// Phone navigation. Roles with more items than fit show their primary ones
// plus "More" (a sheet with the rest), so the bar never scrolls sideways.
export function BottomTabBar({ role, unread }: { role: UserRole; unread: UnreadCounts }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = getNavItems(role);
  const activeHref = getActiveHref(items, pathname);

  const overflow = items.length > MAX_TABS;
  const tabs = overflow ? items.filter((i) => i.primary).slice(0, MAX_TABS - 1) : items;
  const more = overflow ? items.filter((i) => !tabs.includes(i)) : [];
  const moreActive = more.some((i) => i.href === activeHref);
  const moreBadge = more.reduce((n, i) => n + (i.badge ? unread[i.badge] : 0), 0);

  const renderTab = (item: NavItem) => {
    const active = item.href === activeHref;
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} className={tabClass(active)} aria-current={active ? "page" : undefined}>
        <span className="relative">
          <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
          {item.badge && <UnreadBadge count={unread[item.badge]} className="absolute -top-1.5 -right-2.5" />}
        </span>
        <span className="max-w-full truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/60 bg-background/97 pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
      >
        {tabs.map(renderTab)}
        {overflow && (
          <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(moreActive)} aria-haspopup="dialog">
            <span className="relative">
              <MoreHorizontal className="size-5" strokeWidth={moreActive ? 2.25 : 1.75} />
              <UnreadBadge count={moreBadge} className="absolute -top-1.5 -right-2.5" />
            </span>
            More
          </button>
        )}
      </nav>

      {overflow && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid gap-1 px-4">
              {more.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted",
                      active && "bg-muted"
                    )}
                  >
                    <Icon className="size-5 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && <UnreadBadge count={unread[item.badge]} />}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
