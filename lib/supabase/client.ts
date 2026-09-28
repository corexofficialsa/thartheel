import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}

// Realtime joins with whatever token it has at subscribe time. Right after
// page load the session may not be loaded yet, so the join goes out as anon
// and RLS silently drops every event — hand it the user's token first.
export async function authorizeRealtime(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) await supabase.realtime.setAuth(session.access_token);
}
