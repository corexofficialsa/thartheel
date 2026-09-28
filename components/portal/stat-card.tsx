import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  href,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  suffix?: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <Card
      className={cn(
        "h-full",
        href && "hover:-translate-y-0.5 hover:border-brass/40 hover:shadow-lifted",
        className
      )}
    >
      <CardContent className="flex h-full flex-col justify-between gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="flex min-w-0 items-center gap-2 text-[0.8rem] sm:text-sm">
            <Icon className="size-4 shrink-0" />
            {label}
          </span>
          {href && (
            <ArrowUpRight className="size-4 opacity-0 transition-all duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:opacity-100" />
          )}
        </div>
        <p className="font-heading text-[2rem] leading-none font-normal tracking-[-0.02em] sm:text-[2.5rem]">
          {typeof value === "number" ? <AnimatedNumber value={value} suffix={suffix} /> : value}
        </p>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring">
      {content}
    </Link>
  ) : (
    content
  );
}
