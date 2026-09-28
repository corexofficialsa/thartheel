import { cn } from "@/lib/utils";

// The one page title treatment for every portal page: a serif display
// heading, an optional small eyebrow above it, a measured-width description,
// and an optional actions slot aligned to the right on wide screens.
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            <span aria-hidden className="h-px w-5 bg-brass" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-[2rem] leading-[1.1] font-normal tracking-[-0.02em] md:text-[2.5rem]">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-[62ch] text-[0.95rem] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
