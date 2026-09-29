"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NotificationItem } from "@/lib/notifications/kinds";
import { NotificationBell } from "./notification-bell";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL } from "./nav-config";
import type { UserRole } from "@/lib/supabase/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TopBar({
  name,
  role,
  unreadCount,
  recent,
}: {
  name: string;
  role: UserRole;
  unreadCount: number;
  recent: NotificationItem[];
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:px-8">
      <span className="flex items-center gap-2.5 md:hidden">
        <LogoMark className="size-7" />
        <span className="font-heading text-[1.05rem] font-medium tracking-[-0.01em]">Mirqath</span>
      </span>
      <span className="hidden text-sm text-muted-foreground md:block">{ROLE_LABEL[role]} portal</span>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell role={role} unreadCount={unreadCount} items={recent} />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" />}>
            <Avatar className="size-7 rounded-lg after:rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-[11px] font-medium text-primary-foreground">{initials(name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{ROLE_LABEL[role]}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
