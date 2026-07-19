import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:justify-between md:px-6">
        <div className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="font-medium text-foreground">Halaqa Academy</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/register/student" className="hover:text-foreground">
            Student registration
          </Link>
          <Link href="/register/teacher" className="hover:text-foreground">
            Teacher registration
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Halaqa Academy. All rights reserved.</p>
      </div>
    </footer>
  );
}
