"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEY = "mirqath-cookie-notice";
const PORTALS = ["/admin", "/board", "/finance", "/teacher", "/student"];

// Dismissal must work even where localStorage is blocked or throws (app
// webviews, in-app browsers like WhatsApp's, strict privacy modes) — there
// the notice used to reappear instantly and cover the login button. So:
// an in-memory flag hides it at once, and a cookie backs up localStorage.
let dismissedInMemory = false;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function readDismissed() {
  if (dismissedInMemory) return true;
  try {
    if (localStorage.getItem(KEY) === "ok") return true;
  } catch {}
  try {
    return document.cookie.split("; ").includes(`${KEY}=ok`);
  } catch {
    return false;
  }
}
function dismiss() {
  dismissedInMemory = true;
  try {
    localStorage.setItem(KEY, "ok");
  } catch {}
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${KEY}=ok; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  } catch {}
  listeners.forEach((l) => l());
}

// A plain notice, not a consent wall: the site uses only cookies that are
// needed to work (sign-in, plus which campaign link brought a visitor), so
// there's nothing to opt into. Shown once per browser. On phones it's a slim
// strip at the very bottom so it can't cover form buttons.
export function CookieNotice() {
  const pathname = usePathname();
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  if (dismissed) return null;

  const inPortal = PORTALS.some((p) => pathname.startsWith(p));
  // Leave room for the floating contact button on public marketing pages.
  const hasContactButton = pathname === "/" || pathname === "/privacy";

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className={cn(
        "fixed inset-x-2 z-50 flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-lifted print:hidden",
        hasContactButton && "right-[4.5rem]",
        "md:inset-x-auto md:left-6 md:max-w-sm md:items-start md:rounded-2xl md:p-4",
        inPortal ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6" : "bottom-[calc(0.5rem+env(safe-area-inset-bottom))] md:bottom-6"
      )}
    >
      <Cookie className="hidden size-5 shrink-0 text-brass md:block" />
      <p className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground md:text-sm">
        Only essential cookies — no ads or tracking.{" "}
        <Link href="/privacy" className="text-primary underline underline-offset-4">
          Privacy
        </Link>
      </p>
      <Button type="button" size="sm" onClick={dismiss} className="shrink-0">
        Got it
      </Button>
    </div>
  );
}
