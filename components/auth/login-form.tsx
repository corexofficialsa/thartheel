"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/app/(auth)/login/actions";

export function LoginForm({ role }: { role: "student" | "teacher" | "staff" }) {
  const [state, formAction, isPending] = useActionState(signIn, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {role !== "staff" && <input type="hidden" name="role" value={role} />}

      <div className="space-y-2">
        <Label htmlFor="identifier">{role === "student" ? "Email" : "Email or username"}</Label>
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

      {role !== "staff" && (
        <div className="space-y-1 text-center text-sm text-muted-foreground">
          <p>
            New here?{" "}
            <Link href={`/register/${role}`} className="text-primary underline underline-offset-4">
              Register as a {role}
            </Link>
            .
          </p>
          <p>
            <Link
              href={role === "student" ? "/login/teacher" : "/login/student"}
              className="text-primary underline underline-offset-4"
            >
              {role === "student" ? "Teacher" : "Student"} log in instead
            </Link>
          </p>
        </div>
      )}
    </form>
  );
}
