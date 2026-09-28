import Image from "next/image";
import { cn } from "@/lib/utils";

// The Mirqath brand assets, cut from the official logo (public/brand). Both
// are navy on transparent, so dark mode flips them to white to stay visible.

// The symbol on its own — nav bars, sidebar, small spaces.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <Image
        src="/brand/mirqath-mark.png"
        alt=""
        fill
        sizes="64px"
        className="object-contain dark:brightness-0 dark:invert"
      />
    </span>
  );
}

// Symbol + "MIRQATH / Quran Academy" wordmark — auth screens and other
// places with room for the full lockup.
export function LogoFull({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/mirqath-logo.png"
      alt="Mirqath Quran Academy"
      width={1200}
      height={1046}
      priority={priority}
      className={cn("h-auto dark:brightness-0 dark:invert", className)}
    />
  );
}
