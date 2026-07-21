import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/lib/supabase/types";
import { encodeProfileHeader } from "@/lib/auth/profile-header";

const ROLE_FOR_PREFIX: Record<string, UserRole> = {
  "/student": "student",
  "/teacher": "teacher",
  "/admin": "admin",
  "/board": "board",
  "/finance": "finance",
};

// Second layer of the auth design (see plan): login already checks
// profiles.status once at sign-in, but a role/status change (e.g. board
// removes a teacher) must take effect on the very next request even if that
// teacher still holds a live session — so we re-check on every portal request.
export async function proxy(request: NextRequest) {
  // Always strip any client-supplied x-profile header first — it's only ever
  // meant to be set below, by this middleware, right before invoking the
  // Server Component, so a request must never be able to forward one the
  // client set directly (which would otherwise let it spoof its own role).
  request.headers.delete("x-profile");

  const prefix = Object.keys(ROLE_FOR_PREFIX).find((p) => request.nextUrl.pathname.startsWith(p));
  if (!prefix) return NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next({ request });

  const response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, name, email")
    .eq("id", user.id)
    .single();

  const requiredRole = ROLE_FOR_PREFIX[prefix];
  if (!profile || profile.status !== "active" || profile.role !== requiredRole) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Hand the already-verified profile down to the Server Component via a
  // request header, so getCurrentProfile() doesn't have to re-fetch it —
  // every portal page was independently re-querying auth.getUser() +
  // profiles on top of this same check, doubling the round-trip on every
  // single navigation.
  request.headers.set("x-profile", encodeProfileHeader(profile));
  const finalResponse = NextResponse.next({ request });
  response.cookies.getAll().forEach((cookie) => finalResponse.cookies.set(cookie));
  return finalResponse;
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*", "/board/:path*", "/finance/:path*"],
};
