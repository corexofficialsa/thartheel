"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/app/(auth)/forgot-password/actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <MailCheck className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          If an active account uses that email, we&apos;ve sent your login details and a link to set a new password.
          Check your inbox (and spam folder) — the link expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm text-primary underline underline-offset-4">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Email me my login details"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
