// One-time bootstrap: every account (including admins) normally starts
// 'pending' and needs an existing active admin to approve it, so the very
// first admin can't come through the registration flow. Run this once against
// a fresh database to create it directly with the service-role client.
//
// Usage:
//   ADMIN_NAME="Jane Doe" ADMIN_EMAIL="jane@example.com" ADMIN_PASSWORD="..." \
//     npm run bootstrap:admin
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE || null;
  const whatsapp = process.env.ADMIN_WHATSAPP || phone;

  if (!name || !email || !password) {
    console.error(
      "Usage: ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_PHONE=...] [ADMIN_WHATSAPP=...] npm run bootstrap:admin"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
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
    role: "admin",
    status: "active",
    name,
    email,
    phone,
    whatsapp_number: whatsapp,
  });
  if (profileError) {
    console.error("Failed to create profile row:", profileError.message);
    await supabase.auth.admin.deleteUser(created.user.id);
    process.exit(1);
  }

  console.log(`Admin account created for ${email}. Log in at /login.`);
}

main();
