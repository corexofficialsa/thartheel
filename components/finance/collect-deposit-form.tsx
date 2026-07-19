"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collectDeposit, type ActionState } from "@/app/(portal)/finance/ledger/actions";

export function CollectDepositForm({ students }: { students: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(collectDeposit, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <Select name="studentId" required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Student" />
        </SelectTrigger>
        <SelectContent>
          {students.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
      {state?.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Collect deposit"}
      </Button>
    </form>
  );
}
