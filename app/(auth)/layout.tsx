import Link from "next/link";
import { LogoFull } from "@/components/brand/logo-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain relative flex min-h-svh flex-col items-center justify-center gap-8 bg-[radial-gradient(50rem_25rem_at_50%_-10%,color-mix(in_oklch,var(--brass)_12%,transparent),transparent_70%)] p-4 md:p-6">
      <Link href="/" aria-label="Mirqath Quran Academy — home" className="relative">
        <LogoFull priority className="w-40 md:w-44" />
      </Link>
      <div className="relative w-full max-w-sm has-[[data-wide]]:max-w-xl">{children}</div>
    </div>
  );
}
