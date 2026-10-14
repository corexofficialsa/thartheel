import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Fallback only if the settings row is somehow missing (see 0047).
const DEFAULT_REGISTRATION_FEE = 600;

// The current registration fee, as set by finance (academy_settings).
export async function getRegistrationFee(): Promise<number> {
  const { data } = await createAdminClient()
    .from("academy_settings")
    .select("registration_fee")
    .eq("id", 1)
    .maybeSingle();
  return data ? Number(data.registration_fee) : DEFAULT_REGISTRATION_FEE;
}
