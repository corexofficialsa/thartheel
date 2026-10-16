"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchPortal, type SearchResult } from "@/lib/search/actions";
import type { UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { getNavItems } from "./nav-config";

type Row = { key: string; label: string; sublabel?: string; type: string; href: string };

// Ctrl/⌘+K search across the portal: pages instantly, people/classrooms/
// homework from the server (role-scoped) as you type.
export function PortalSearch({ role }: { role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [isPending, startTransition] = useTransition();
  const latest = useRef("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    latest.current = q;
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchPortal(q);
        if (latest.current === q) setRemote(results);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = getNavItems(role)
      .filter((i) => !q || i.label.toLowerCase().includes(q))
      .map((i) => ({ key: `page:${i.href}`, label: i.label, type: "Page", href: i.href }));
    const people = q.length >= 2 ? remote.map((r, i) => ({ key: `r:${i}:${r.href}`, ...r })) : [];
    return [...pages, ...people];
  }, [query, remote, role]);

  function close() {
    setOpen(false);
    setQuery("");
    setRemote([]);
    setActive(0);
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="gap-2 px-2 text-muted-foreground md:min-w-48 md:justify-start md:border md:border-border md:bg-card md:px-3"
      >
        <Search />
        <span className="hidden text-sm md:inline">Search…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 text-[10px] font-medium md:inline">Ctrl K</kbd>
      </Button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="top-[12svh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Search the portal</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, rows.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter" && rows[active]) {
                  e.preventDefault();
                  go(rows[active].href);
                }
              }}
              placeholder={role === "student" ? "Search pages, classes, homework…" : "Search pages, people, classrooms…"}
              aria-label="Search"
              className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
            {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-[min(24rem,60svh)] overflow-y-auto p-1.5" role="listbox" aria-label="Results">
            {rows.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {query.trim().length >= 2 && !isPending ? "No matches." : "Type to search."}
              </p>
            ) : (
              rows.map((row, i) => (
                <Link
                  key={row.key}
                  href={row.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(row.href);
                  }}
                  onMouseEnter={() => setActive(i)}
                  role="option"
                  aria-selected={i === active}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    i === active ? "bg-muted" : "hover:bg-muted/60"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{row.label}</span>
                    {row.sublabel && <span className="block truncate text-xs text-muted-foreground">{row.sublabel}</span>}
                  </span>
                  <span className="shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                    {row.type}
                  </span>
                  {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
