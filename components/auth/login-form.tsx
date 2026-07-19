"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/app/(auth)/login/actions";

export function LoginForm({ role }: { role: "student" | "teacher" }) {
  const [state, formAction, isPending] = useActionState(signIn, undefined);
  const registerHref = role === "student" ? "/register/student" : "/register/teacher";
  const otherRoleHref = role === "student" ? "/login/teacher" : "/login/student";
  const otherRoleLabel = role === "student" ? "Teacher" : "Student";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={role} />

      <div className="space-y-2">
        <Label htmlFor="identifier">{role === "teacher" ? "Email or username" : "Email"}</Label>
        <Input id="identifier" name="identifier" autoComplete="username" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="rememberMe" name="rememberMe" />
        <Label htmlFor="rememberMe" className="font-normal text-muted-foreground">
          Remember me for 30 days
        </Label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Logging in..." : "Log in"}
      </Button>

      <div className="space-y-1 text-center text-sm text-muted-foreground">
        <p>
          New here?{" "}
          <Link href={registerHref} className="text-primary underline underline-offset-4">
            Register as a {role}
          </Link>
          .
        </p>
        <p>
          <Link href={otherRoleHref} className="text-primary underline underline-offset-4">
            {otherRoleLabel} log in instead
          </Link>
        </p>
      </div>
    </form>
  );
}
