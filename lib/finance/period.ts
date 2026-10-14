// Reporting periods for the financial summary, chosen via ?months=N (the
// last N months, ending with the current one) or ?from=YYYY-MM&to=YYYY-MM.

export const PERIOD_PRESETS = [3, 4, 6, 12] as const;
const MONTH = /^\d{4}-\d{2}$/;

export type Period = {
  from: string; // YYYY-MM
  to: string; // YYYY-MM
  startDate: string; // YYYY-MM-DD, inclusive
  endDate: string; // YYYY-MM-DD, inclusive
  preset: number | null;
  label: string;
};

function monthKey(year: number, monthIndex: number) {
  const d = new Date(Date.UTC(year, monthIndex, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function lastDayOf(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
}

export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function resolvePeriod(params: { months?: string | string[]; from?: string | string[]; to?: string | string[] }, today = new Date()): Period {
  const current = monthKey(today.getUTCFullYear(), today.getUTCMonth());
  const from = typeof params.from === "string" && MONTH.test(params.from) ? params.from : null;
  const to = typeof params.to === "string" && MONTH.test(params.to) ? params.to : null;

  let start: string, end: string, preset: number | null;
  if (from && to) {
    [start, end] = from <= to ? [from, to] : [to, from];
    preset = null;
  } else {
    const n = Number(params.months);
    preset = (PERIOD_PRESETS as readonly number[]).includes(n) ? n : 3;
    start = monthKey(today.getUTCFullYear(), today.getUTCMonth() - (preset - 1));
    end = current;
  }

  return {
    from: start,
    to: end,
    startDate: `${start}-01`,
    endDate: lastDayOf(end),
    preset,
    label: start === end ? formatMonth(start) : `${formatMonth(start)} – ${formatMonth(end)}`,
  };
}
