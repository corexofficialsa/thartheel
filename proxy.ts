import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/lib/supabase/types";

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
  const response = NextResponse.next({ request });

  const prefix = Object.keys(ROLE_FOR_PREFIX).find((p) => request.nextUrl.pathname.startsWith(p));
  if (!prefix) return response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

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

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();

  const requiredRole = ROLE_FOR_PREFIX[prefix];
  if (!profile || profile.status !== "active" || profile.role !== requiredRole) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*", "/board/:path*", "/finance/:path*"],
};
