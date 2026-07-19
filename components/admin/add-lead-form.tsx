"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLead, type ActionState } from "@/app/(portal)/admin/growth/actions";

export function AddLeadForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(addLead, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <Input name="source" placeholder="Source (Instagram, referral...)" required />
      <Input name="name" placeholder="Name" required />
      <Input name="contact" placeholder="Phone or email" required />
      <Input name="notes" placeholder="Notes (optional)" />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <div className="sm:col-span-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add lead"}
        </Button>
      </div>
    </form>
  );
}
