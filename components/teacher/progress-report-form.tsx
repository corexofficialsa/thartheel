"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProgressReport, type ActionState } from "@/app/(portal)/teacher/academics/actions";

export function ProgressReportForm({ students }: { students: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createProgressReport, undefined);

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
      <Select name="period" required defaultValue="weekly">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
        </SelectContent>
      </Select>
      <Textarea name="notes" placeholder="Recitation progress notes..." required rows={1} className="sm:col-span-2" />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save report"}
      </Button>
    </form>
  );
}
