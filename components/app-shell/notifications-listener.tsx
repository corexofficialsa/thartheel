"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authorizeRealtime, createClient } from "@/lib/supabase/client";

// Shows a toast "ping" when a notification arrives and refreshes the server
// layout so the nav's unread badges update without a manual reload.
export function NotificationsListener({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    authorizeRealtime(supabase).then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const n = payload.new as {
              kind: string;
              title: string;
              body: string | null;
              link: string | null;
            };
            router.refresh();
            // The chat page already shows new messages live; no ping needed there.
            if (n.kind === "message" && n.link && pathnameRef.current.startsWith(n.link)) return;
            toast(n.title, {
              description: n.body ?? undefined,
              duration: 8000,
              action: n.link ? { label: "Open", onClick: () => router.push(n.link!) } : undefined,
            });
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
