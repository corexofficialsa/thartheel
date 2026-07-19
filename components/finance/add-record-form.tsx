"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addFinanceRecord, type ActionState } from "@/app/(portal)/finance/ledger/actions";

export function AddRecordForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(addFinanceRecord, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-5">
      <Select name="type" required defaultValue="expense">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>
      <Input name="category" placeholder="Category" required />
      <Input name="amount" type="number" step="0.01" placeholder="Amount (SAR)" required />
      <Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
      <Input name="description" placeholder="Description (optional)" />
      {state?.error && <p className="text-sm text-destructive sm:col-span-5">{state.error}</p>}
      <div className="sm:col-span-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add record"}
        </Button>
      </div>
    </form>
  );
}
