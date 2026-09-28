import Link from "next/link";
import { Bell, BookOpen, CheckCircle2, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { markAllNotificationsRead } from "@/lib/notifications/actions";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const KIND_ICON = { message: MessageSquare, homework: BookOpen, graded: CheckCircle2, reopened: RotateCcw } as const;

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

export async function NotificationsPage({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {(notifications ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Bell className="size-8" />
            <p className="text-sm">No notifications yet. New messages, homework, and grades will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {(notifications ?? []).map((n) => {
              const Icon = KIND_ICON[n.kind];
              const content = (
                <div className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50", !n.read_at && "bg-primary/[0.04]")}>
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm", !n.read_at && "font-semibold")}>{n.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                    </div>
                    {n.body && <p className="truncate text-sm text-muted-foreground">{n.body}</p>}
                  </div>
                  {!n.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </div>
              );
              return <li key={n.id}>{n.link ? <Link href={n.link}>{content}</Link> : content}</li>;
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
