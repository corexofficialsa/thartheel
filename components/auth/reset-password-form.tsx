"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/(auth)/reset-password/actions";

export function ResetPasswordForm({ tokenHash }: { tokenHash: string }) {
  const [state, formAction, isPending] = useActionState(resetPassword, undefined);

  if (state?.done) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-success/15 text-success">
          <CheckCircle2 className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground">Your password has been updated. You can log in with it now.</p>
        <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
          Go to log in
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tokenHash" value={tokenHash} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">
          {state.error}{" "}
          {state.error.includes("new") && (
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
          )}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Set new password"}
      </Button>
    </form>
  );
}
