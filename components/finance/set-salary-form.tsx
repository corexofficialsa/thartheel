"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setSalaryAllocation, type ActionState } from "@/app/(portal)/finance/ledger/actions";

type Person = { id: string; name: string; role: "teacher" | "admin" };
type Category = "staff" | "tech_support" | "tech_maintenance";

export function SetSalaryForm({ people }: { people: Person[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(setSalaryAllocation, undefined);
  const [category, setCategory] = useState<Category>("staff");

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <Select name="category" required value={category} onValueChange={(value) => setCategory(value as Category)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="staff">Staff salary</SelectItem>
          <SelectItem value="tech_support">Tech support</SelectItem>
          <SelectItem value="tech_maintenance">Tech maintenance</SelectItem>
        </SelectContent>
      </Select>
      {category === "staff" ? (
        <Select name="profileId" required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Person" />
          </SelectTrigger>
          <SelectContent>
            {people.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input name="payee" placeholder="Paid to (person or company)" required />
      )}
      <Input name="period" placeholder="Period, e.g. 2026-07" required />
      <Input name="amount" type="number" step="0.01" placeholder="Amount (SAR)" required />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <div className="sm:col-span-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Set allocation"}
        </Button>
      </div>
    </form>
  );
}
