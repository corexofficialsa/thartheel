"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setBudget, type ActionState } from "@/app/(portal)/finance/ledger/actions";

export function SetBudgetForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(setBudget, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <Input name="period" placeholder="Period, e.g. 2026-07" required />
      <Input name="category" placeholder="Category" required />
      <Input name="limitAmount" type="number" step="0.01" placeholder="Limit (SAR)" required />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Set budget"}
      </Button>
    </form>
  );
}
