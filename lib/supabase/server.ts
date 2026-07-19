import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// Cookie-bound client — respects RLS as the calling user. Use this in
// Server Components, Server Actions, and Route Handlers.
//
// `rememberMe` only matters at sign-in time (it controls how long the auth
// cookies set by that request persist): true forces a 30-day cookie, false
// forces a browser-session cookie, and omitting it leaves Supabase's default
// cookie lifetime untouched — every other call site should omit it.
export async function createClient(opts?: { rememberMe?: boolean }) {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const resolvedOptions =
              opts?.rememberMe === undefined
                ? options
                : opts.rememberMe
                  ? { ...options, maxAge: REMEMBER_ME_MAX_AGE_SECONDS, expires: undefined }
                  : { ...options, maxAge: undefined, expires: undefined };
            cookieStore.set(name, value, resolvedOptions);
          });
        } catch {
          // setAll is called from a Server Component during render, where
          // cookies can't be mutated — middleware refreshes the session instead.
        }
      },
    },
  });
}
