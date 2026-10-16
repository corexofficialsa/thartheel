"use client";

import { useEffect } from "react";

// Registers the minimal offline-page service worker (public/sw.js) in
// production builds only, so development never runs a stale worker.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
