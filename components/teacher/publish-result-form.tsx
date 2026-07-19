"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishResult, type ActionState } from "@/app/(portal)/teacher/academics/actions";

export function PublishResultForm({
  examId,
  studentId,
  studentName,
  existingMarks,
}: {
  examId: string;
  studentId: string;
  studentName: string;
  existingMarks?: number | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(publishResult, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="examId" value={examId} />
      <input type="hidden" name="studentId" value={studentId} />
      <span className="w-32 truncate">{studentName}</span>
      <Input name="marks" type="number" step="0.5" defaultValue={existingMarks ?? ""} placeholder="Marks" className="w-24" />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Saving..." : "Publish"}
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
