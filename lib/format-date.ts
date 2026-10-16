// One date style across the app, always in the academy's time zone so the
// server (UTC on Vercel) and browsers agree. Plain calendar dates
// ("2026-09-27", e.g. ledger entries) are shown as-is, never shifted.
const TZ = "Asia/Riyadh";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dateUtcFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (typeof value === "string" && DATE_ONLY.test(value)) return dateUtcFmt.format(new Date(`${value}T00:00:00Z`));
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateTimeFmt.format(new Date(value));
}
