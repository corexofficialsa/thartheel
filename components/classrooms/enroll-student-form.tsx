"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enrollStudentInClassroom, type ActionState } from "@/lib/classrooms/actions";

export function EnrollStudentForm({
  classroomId,
  availableStudents,
}: {
  classroomId: string;
  availableStudents: { id: string; name: string; email: string }[];
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(enrollStudentInClassroom, undefined);

  if (availableStudents.length === 0) {
    return <p className="text-xs text-muted-foreground">No more active students to enroll.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="classroomId" value={classroomId} />
      <Select name="studentId" required>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Add a student..." />
        </SelectTrigger>
        <SelectContent>
          {availableStudents.map((student) => (
            <SelectItem key={student.id} value={student.id}>
              {student.name} ({student.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adding..." : "Enroll"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
