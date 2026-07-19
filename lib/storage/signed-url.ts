import "server-only";
import { createClient } from "@/lib/supabase/server";

// Storage buckets are private; every read goes through a signed URL scoped to
// the caller's own session, so Supabase's storage RLS policy on the object
// (see supabase/migrations/0010_storage.sql) is what actually gates access —
// this just requests the URL, it doesn't grant anything by itself.
export async function createSignedUrl(bucket: string, path: string, expiresInSeconds = 3600): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
