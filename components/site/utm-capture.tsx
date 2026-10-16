"use client";

import { useEffect } from "react";

const COOKIE = "mirqath_utm";
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

// First-touch campaign tracking: if a visitor arrives with utm_* parameters,
// remember them for 30 days so a later registration can record which link
// brought them. Never overwrites an earlier campaign.
export function UtmCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!KEYS.some((k) => params.get(k))) return;
    if (document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`))) return;
    const data: Record<string, string> = {};
    for (const k of KEYS) {
      const v = params.get(k);
      if (v) data[k] = v.slice(0, 100);
    }
    data.landing = window.location.pathname.slice(0, 100);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(data))}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax${secure}`;
  }, []);
  return null;
}
