import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { landingPath } from "@/lib/auth/landing";

// Already signed in (e.g. "Remember me", or reopening the installed app,
// which starts at /login): skip the form and go straight to the portal.
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (profile?.status === "active") redirect(landingPath(profile.role));
  return children;
}
