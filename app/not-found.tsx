import Link from "next/link";
import { LogoFull } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="paper-grain relative flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <LogoFull className="relative w-32" />
      <p className="relative mt-8 font-heading text-7xl font-light text-brass tabular-nums">404</p>
      <h1 className="relative mt-4 font-heading text-3xl font-normal tracking-[-0.02em]">This page doesn&apos;t exist</h1>
      <p className="relative mt-3 max-w-[44ch] text-muted-foreground">
        The link may be old or mistyped. Head back to the home page, or log in to your portal.
      </p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Go to home page
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
          Log in
        </Button>
      </div>
    </main>
  );
}
