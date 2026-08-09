"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitComplaint, type ActionState } from "@/lib/complaints/actions";

export function SubmitComplaintForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(submitComplaint, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" placeholder="Brief summary of the issue" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Details</Label>
        <Textarea id="description" name="description" placeholder="Describe what happened" required rows={4} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit complaint"}
      </Button>
    </form>
  );
}
