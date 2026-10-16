import Link from "next/link";
import { X } from "lucide-react";

// Shown on list pages opened from search (?q=…).
export function QueryNotice({ q, clearHref, count }: { q: string; clearHref: string; count?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">
        {count === undefined ? "Showing matches" : `${count} match${count === 1 ? "" : "es"}`} for{" "}
        <strong className="text-foreground">“{q}”</strong>
      </span>
      <Link href={clearHref} className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">
        <X className="size-3.5" /> Clear
      </Link>
    </div>
  );
}

export function readQuery(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 60) : "";
}

export function matches(q: string, ...fields: (string | null | undefined)[]) {
  const needle = q.toLowerCase();
  return !needle || fields.some((f) => f?.toLowerCase().includes(needle));
}
