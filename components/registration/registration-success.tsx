import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegistrationSuccess() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
      <CheckCircle2 className="size-10 text-primary" />
      <p className="font-medium">Registration submitted!</p>
      <p className="text-sm text-muted-foreground">
        An admin will review your details. Once approved, you&apos;ll get a WhatsApp message with a link to log in.
      </p>
      <Button className="mt-2" nativeButton={false} render={<Link href="/" />}>
        Go back to home
      </Button>
    </div>
  );
}
