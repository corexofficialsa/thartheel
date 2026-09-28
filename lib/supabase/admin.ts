import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

// Service-role client — bypasses RLS entirely. Server-only (never import
// into a Client Component); used for registration (auth.admin.createUser) so no
// session/cookie is ever set before an admin approves the account, for
// password-reset links (auth.admin.generateLink), and for notification logging.
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
