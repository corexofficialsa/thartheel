"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Appears after scrolling down a screen or so. `offsetClassName` lifts it
// above other fixed controls (contact button, mobile tab bar).
export function BackToTop({ offsetClassName = "bottom-20 md:bottom-24" }: { offsetClassName?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(window.scrollY > 700));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={cn(
        "fixed right-4 z-40 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none print:hidden md:right-6",
        offsetClassName,
        visible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      <ArrowUp className="size-4.5" />
    </button>
  );
}
