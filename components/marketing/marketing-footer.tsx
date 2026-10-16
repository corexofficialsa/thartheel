import Link from "next/link";
import { Mail } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { CopyButton } from "@/components/common/copy-button";
import { CONTACT_EMAIL, TERMS_URL } from "@/lib/site";

const LINKS = [
  { href: "/#programs", label: "Programs" },
  { href: "/#faq", label: "FAQ" },
  { href: "/register/student", label: "Student registration" },
  { href: "/register/teacher", label: "Teacher registration" },
  { href: "/login", label: "Log in" },
  { href: "/login/staff", label: "Staff log in" },
  { href: "/privacy", label: "Privacy" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-12 pb-24 text-sm text-muted-foreground md:grid-cols-[1fr_auto] md:px-6 md:pb-12">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Mirqath Quran Academy — home">
            <LogoMark className="size-8" />
            <span className="font-heading text-base text-foreground">Mirqath Quran Academy</span>
          </Link>
          <p className="flex items-center gap-1">
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:text-foreground">
              <Mail className="size-4" />
              {CONTACT_EMAIL}
            </a>
            <CopyButton value={CONTACT_EMAIL} label="Copy email address" />
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 md:max-w-md md:justify-end">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
            Terms &amp; Conditions
          </a>
        </nav>
        <p className="border-t border-border/60 pt-6 md:col-span-2">
          &copy; {new Date().getFullYear()} Mirqath Quran Academy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
