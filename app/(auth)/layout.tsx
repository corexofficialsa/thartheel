import { LogoMark } from "@/components/brand/logo-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-secondary/40 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <LogoMark className="size-8" />
        <span className="text-lg font-semibold">Halaqa Academy</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
