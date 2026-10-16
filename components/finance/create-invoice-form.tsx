"use client";

import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFeeInvoice } from "@/app/(portal)/finance/ledger/actions";

export function CreateInvoiceForm({ students }: { students: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionToast(createFeeInvoice, "Invoice created.");

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
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
      <Input name="period" placeholder="Period, e.g. 2026-07" required />
      <Input name="amount" type="number" step="0.01" placeholder="Amount" defaultValue={100} />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create invoice"}
      </Button>
    </form>
  );
}
