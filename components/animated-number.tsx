"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 800;

// Plain rAF count-up instead of pulling in framer-motion — this is the only
// thing StatCard needs it for, and StatCard renders on every portal home
// page, so the whole animation library was shipping to the client just to
// count a handful of digits up.
function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const current = Math.round(value * easeOut(progress));
      if (node) node.textContent = `${current}${suffix}`;
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}
