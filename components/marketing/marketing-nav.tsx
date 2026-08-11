"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, LogIn, Menu, UserPlus, Users } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "#programs", label: "Programs" },
  { href: "#features", label: "How it works" },
];

export function MarketingNav() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Closing the sheet (React state) and next/link's own click handling
  // (async — it fetches the RSC payload before committing the route) were
  // two independent systems racing on the same click, and in production
  // builds specifically the navigation sometimes lost that race and just
  // silently did nothing (worse on touch/Android). Taking the click over
  // completely and driving both from one place removes the race outright.
  function navigateFromSheet(href: string) {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      setMobileOpen(false);
      router.push(href);
    };
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="size-9" />
          <span className="font-heading text-lg font-semibold tracking-tight">Halaqa Academy</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            <LogIn className="size-4" /> Log in
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="default" />}>
              <UserPlus className="size-4" /> Register
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuItem render={<Link href="/register/student" />} className="gap-2">
                <GraduationCap className="size-4" />
                <span>
                  <span className="block font-medium">Register as a student</span>
                  <span className="block text-xs text-muted-foreground">Join a Level 1 or Level 2 class</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/register/teacher" />} className="gap-2">
                <Users className="size-4" />
                <span>
                  <span className="block font-medium">Register as a teacher</span>
                  <span className="block text-xs text-muted-foreground">Apply to teach at the academy</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>Halaqa Academy</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 h-px bg-border" />
            <Link
              href="/register/student"
              onClick={navigateFromSheet("/register/student")}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              Register as a student
            </Link>
            <Link
              href="/register/teacher"
              onClick={navigateFromSheet("/register/teacher")}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              Register as a teacher
            </Link>
            <Link
              href="/login"
              onClick={navigateFromSheet("/login")}
              className="mt-2 rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
            >
              Log in
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
