// Attendance dates are recorded in Riyadh time (see join_classroom), so
// "today" must be computed the same way, not from the server's clock zone.
export function riyadhToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
