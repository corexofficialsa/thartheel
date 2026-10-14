import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Kept deliberately light: on Vercel the proxy runs at the edge nearest the
// visitor (e.g. Mumbai), far from the database in Frankfurt, and it runs
// before every portal request including link prefetches. So it makes no
// database calls. It only:
//   1. verifies the session JWT locally (getClaims — the project signs with
//      asymmetric ES256 keys, so no Auth-server round trip) and refreshes an
//      expired session, writing the new cookies — the one job that must
//      happen here, since Server Components can't set cookies;
//   2. sends visitors without a valid session to /login.
// Role and status (active/removed) are enforced next to the database by
// requireRole() in each portal's layout (PortalLayout), and by RLS.
export async function proxy(request: NextRequest) {
  // Never let a client forward a spoofed profile header to the app.
  request.headers.delete("x-profile");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*", "/board/:path*", "/finance/:path*"],
};
