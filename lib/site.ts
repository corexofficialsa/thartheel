// Public contact details and shared site facts.
export const CONTACT_EMAIL = "info@mirqath.com";
export const TERMS_URL = "https://drive.google.com/file/d/1zk-fSzzSOX0GI8wl0CMC9A7PUWPBQI7J/view?usp=sharing";
// Bump when the privacy notice or FAQ content changes.
export const PRIVACY_UPDATED = "2026-10-16";
export const FAQ_UPDATED = "2026-10-16";

export function formatLongDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
