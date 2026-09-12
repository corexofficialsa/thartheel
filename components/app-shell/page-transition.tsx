"use client";

import { usePathname } from "next/navigation";

// The `<main>` element itself never remounts across client-side
// navigations, only its children swap — so a plain CSS animation class on
// the children would only ever play once, on first load. Keying this
// wrapper by pathname forces a fresh DOM node per page, which replays the
// entrance animation on every navigation without pulling in a JS animation
// library.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}
