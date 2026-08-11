// Next.js inlines `process.env.NEXT_PUBLIC_X` into client bundles by finding
// that exact literal member expression at build time — it can't follow a
// dynamic `process.env[name]` lookup. So the value has to be read at each
// call site (a real, literal `process.env.NEXT_PUBLIC_...`) and handed in,
// not looked up inside a shared helper by name, or every client component
// calling these gets `undefined` in the browser despite working on the server.
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env.local and fill in your Supabase project credentials.`
    );
  }
  return value;
}

export const supabaseUrl = () => requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = () =>
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseServiceRoleKey = () =>
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
