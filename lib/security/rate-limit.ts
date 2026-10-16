import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// The visitor's IP as seen by Vercel's edge (x-real-ip / x-vercel-forwarded-for
// are set by Vercel itself, so clients can't spoof them there).
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// Records one attempt against `key` and returns false once `max` attempts fall
// inside the last `windowSeconds` (see hit_rate_limit in 0048). Fails open: if
// the check itself errors, the request is allowed rather than locking
// everyone out.
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] check failed:", error.message);
    return true;
  }
  return data === true;
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
