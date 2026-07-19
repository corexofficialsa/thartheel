"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegistrationSuccess } from "./registration-success";

export type RegisterState = { error?: string; success?: boolean } | undefined;
type RegisterAction = (prevState: RegisterState, formData: FormData) => Promise<RegisterState>;

export function TeacherRegistrationForm({
  action,
  levels,
}: {
  action: RegisterAction;
  levels: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  if (state?.success) {
    return <RegistrationSuccess />;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" type="tel" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsappNumber">WhatsApp number</Label>
        <Input id="whatsappNumber" name="whatsappNumber" type="tel" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="levelId">Level you teach</Label>
        <Select name="levelId" required>
          <SelectTrigger id="levelId" className="w-full">
            <SelectValue placeholder="Select a level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cv">CV (PDF)</Label>
        <Input id="cv" name="cv" type="file" accept="application/pdf" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting..." : "Register"}
      </Button>
    </form>
  );
}
