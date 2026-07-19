import { cn } from "@/lib/utils";

// Single source of truth for the brand mark — same file as the favicon
// (public/icon.svg) and web app icon, so every usage stays pixel-identical.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[28%]", className)}>
      <img src="/icon.svg" alt="" className="h-full w-full" />
    </span>
  );
}
