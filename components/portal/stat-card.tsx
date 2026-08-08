import Link from "next/link";
import type { LucideIcon } from "lucide-react";
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
    <Card className={cn(href && "transition-colors hover:bg-accent/10", className)}>
      <CardContent className="flex flex-col gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-3xl font-semibold">
            {typeof value === "number" ? <AnimatedNumber value={value} suffix={suffix} /> : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
