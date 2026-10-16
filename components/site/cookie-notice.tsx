"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEY = "mirqath-cookie-notice";
const PORTALS = ["/admin", "/board", "/finance", "/teacher", "/student"];

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function readDismissed() {
  try {
    return localStorage.getItem(KEY) === "ok";
  } catch {
    return false;
  }
}

// A plain notice, not a consent wall: the site uses only cookies that are
// needed to work (sign-in, plus which campaign link brought a visitor), so
// there's nothing to opt into. Shown once per browser.
export function CookieNotice() {
  const pathname = usePathname();
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  if (dismissed) return null;

  const inPortal = PORTALS.some((p) => pathname.startsWith(p));

  function dismiss() {
    try {
      localStorage.setItem(KEY, "ok");
    } catch {}
    listeners.forEach((l) => l());
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className={cn(
        "fixed inset-x-3 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-card p-4 shadow-lifted print:hidden md:right-auto md:left-6 md:mx-0 md:max-w-sm",
        inPortal ? "bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6" : "bottom-20 md:bottom-6"
      )}
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-brass" />
        <p className="text-sm text-muted-foreground">
          We only use cookies the site needs: to keep you signed in, and to remember which link brought you here. No
          advertising or tracking cookies.{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-4">
            Privacy
          </Link>
        </p>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
