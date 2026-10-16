import "server-only";
import { cookies } from "next/headers";

export type Utm = { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; utmLanding: string | null };

const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 100) : null);

// Reads the first-touch campaign cookie set by <UtmCapture />. Anything
// malformed is ignored — attribution must never block a registration.
export async function readUtm(): Promise<Utm> {
  const raw = (await cookies()).get("mirqath_utm")?.value;
  try {
    const d = raw ? JSON.parse(decodeURIComponent(raw)) : {};
    return { utmSource: clean(d.utm_source), utmMedium: clean(d.utm_medium), utmCampaign: clean(d.utm_campaign), utmLanding: clean(d.landing) };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmLanding: null };
  }
}
