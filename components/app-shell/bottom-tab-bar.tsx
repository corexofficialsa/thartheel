"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItems } from "./nav-config";
import type { UserRole } from "@/lib/supabase/types";

export function BottomTabBar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-sidebar md:hidden pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
