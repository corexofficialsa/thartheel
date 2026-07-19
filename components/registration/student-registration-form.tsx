"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AyahRecorderField } from "./ayah-recorder-field";
import { RegistrationSuccess } from "./registration-success";

export type RegisterState = { error?: string; success?: boolean } | undefined;
type RegisterAction = (prevState: RegisterState, formData: FormData) => Promise<RegisterState>;

type Level = { id: string; name: string; requires_recitation: boolean };
type Ayah = { id: string; reference: string; arabicText: string; translation: string };

export function StudentRegistrationForm({
  action,
  levels,
  ayah,
}: {
  action: RegisterAction;
  levels: Level[];
  ayah: Ayah;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [levelId, setLevelId] = useState("");
  const [recorded, setRecorded] = useState(false);

  const needsRecitation = useMemo(
    () => levels.find((level) => level.id === levelId)?.requires_recitation ?? false,
    [levels, levelId]
  );

  if (state?.success) {
    return <RegistrationSuccess />;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" type="number" min={4} max={90} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="place">Place</Label>
          <Input id="place" name="place" placeholder="City, country" required />
        </div>
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
        <Label htmlFor="levelId">Level you&apos;re looking into</Label>
        <Select name="levelId" required value={levelId} onValueChange={(value) => setLevelId(value as string)}>
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

      {needsRecitation && <AyahRecorderField ayah={ayah} onRecordedChange={setRecorded} />}

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

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting..." : "Register"}
      </Button>
      {needsRecitation && !recorded && (
        <p className="text-center text-xs text-muted-foreground">
          Recording is optional but helps us place you in the right class.
        </p>
      )}
    </form>
  );
}
