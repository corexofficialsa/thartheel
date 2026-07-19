// Board and finance accounts have no public registration form by design
// (see README) — they're created directly with the service-role client,
// active immediately, the same way scripts/bootstrap-admin.ts creates the
// first admin.
//
// Usage:
//   STAFF_ROLE="board" STAFF_NAME="Jane Doe" STAFF_EMAIL="jane@example.com" STAFF_PASSWORD="..." \
//     npm run bootstrap:staff
import { createClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "../lib/supabase/types";
import { supabaseServiceRoleKey, supabaseUrl } from "../lib/supabase/env";

function createAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  const role = process.env.STAFF_ROLE as UserRole | undefined;
  const name = process.env.STAFF_NAME;
  const email = process.env.STAFF_EMAIL;
  const password = process.env.STAFF_PASSWORD;

  if (!role || (role !== "board" && role !== "finance")) {
    console.error('STAFF_ROLE must be "board" or "finance".');
    process.exit(1);
  }
  if (!name || !email || !password) {
    console.error(
      "Usage: STAFF_ROLE=board|finance STAFF_NAME=... STAFF_EMAIL=... STAFF_PASSWORD=... npm run bootstrap:staff"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("STAFF_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    console.error("Failed to create auth user:", createError?.message);
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    role,
    status: "active",
    name,
    email,
  });
  if (profileError) {
    console.error("Failed to create profile row:", profileError.message);
    await supabase.auth.admin.deleteUser(created.user.id);
    process.exit(1);
  }

  console.log(`${role} account created for ${email}. Log in at /login.`);
}

main();
