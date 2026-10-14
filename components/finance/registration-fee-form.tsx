"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRegistrationFee, type ActionState } from "@/app/(portal)/finance/ledger/actions";

export function RegistrationFeeForm({ currentFee }: { currentFee: number }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateRegistrationFee, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="registrationFee">Registration fee (SAR)</Label>
        <Input
          id="registrationFee"
          name="registrationFee"
          type="number"
          min={0}
          step="0.01"
          defaultValue={currentFee}
          className="w-40"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save fee"}
      </Button>
      <p className="basis-full text-xs text-muted-foreground">
        Applies to new registrations and to registration invoices with no payment yet. Paid or part-paid invoices
        keep their amount.
      </p>
      {state?.error && <p className="basis-full text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="basis-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
