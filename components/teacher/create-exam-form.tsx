"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExam, type ActionState } from "@/app/(portal)/teacher/academics/actions";

export function CreateExamForm({ classrooms }: { classrooms: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createExam, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <Select name="classroomId" required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Classroom" />
        </SelectTrigger>
        <SelectContent>
          {classrooms.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="title" placeholder="Exam title" required />
      <Input name="examType" placeholder="Type (e.g. Tajweed oral)" required />
      <Input name="scheduledAt" type="datetime-local" required />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Scheduling..." : "Schedule exam"}
      </Button>
    </form>
  );
}
