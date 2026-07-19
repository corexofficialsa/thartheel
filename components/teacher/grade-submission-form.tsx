"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { gradeSubmission, type ActionState } from "@/app/(portal)/teacher/homework/actions";

export function GradeSubmissionForm({
  submissionId,
  existingGrade,
  existingFeedback,
}: {
  submissionId: string;
  existingGrade?: number | null;
  existingFeedback?: string | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(gradeSubmission, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="submissionId" value={submissionId} />
      <Input
        name="grade"
        type="number"
        step="0.5"
        placeholder="Grade"
        defaultValue={existingGrade ?? ""}
        className="w-24"
      />
      <Textarea name="feedback" placeholder="Feedback (optional)" defaultValue={existingFeedback ?? ""} className="min-w-56 flex-1" rows={1} />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
