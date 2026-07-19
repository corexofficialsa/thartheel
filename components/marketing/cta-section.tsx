import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-4xl bg-primary px-8 py-16 text-center text-primary-foreground md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--accent)_0%,_transparent_55%)] opacity-25"
          />
          <h2 className="relative font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to begin the journey?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/80">
            Registration takes a few minutes. An admin reviews and approves every new account.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="h-11 rounded-xl px-6 text-base"
              nativeButton={false}
              render={<Link href="/register/student" />}
            >
              Register as a student <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-xl border-primary-foreground/30 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10"
              nativeButton={false}
              render={<Link href="/register/teacher" />}
            >
              Register as a teacher
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
