"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/actions";
import { formatNotificationTime, NOTIFICATION_ICON, type NotificationItem } from "@/lib/notifications/kinds";
import type { UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function NotificationBell({
  role,
  unreadCount,
  items,
}: {
  role: UserRole;
  unreadCount: number;
  items: NotificationItem[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function open(item: NotificationItem) {
    startTransition(async () => {
      if (!item.read_at) await markNotificationRead(item.id);
      router.push(item.link ?? `/${role}/notifications`);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          />
        }
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(23rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <span className="font-heading text-base">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <DropdownMenuGroup className="max-h-[min(24rem,60svh)] overflow-y-auto p-1">
            {items.map((item) => {
              const Icon = NOTIFICATION_ICON[item.kind] ?? Bell;
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => open(item)}
                  className="items-start gap-3 rounded-lg px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                      item.read_at ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm leading-snug", !item.read_at && "font-medium")}>{item.title}</span>
                    {item.body && (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.body}</span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground/80">
                      {formatNotificationTime(item.created_at)}
                    </span>
                  </span>
                  {!item.read_at && <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-brass" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem
          onClick={() => router.push(`/${role}/notifications`)}
          className="justify-center rounded-none py-2.5 text-sm text-primary"
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
