"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignTeacher, type ActionState } from "@/lib/classrooms/actions";

export function AssignTeacherForm({
  classroomId,
  currentTeacherId,
  teachers,
}: {
  classroomId: string;
  currentTeacherId: string;
  teachers: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(assignTeacher, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="classroomId" value={classroomId} />
      <Select name="teacherId" required defaultValue={currentTeacherId}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Teacher" />
        </SelectTrigger>
        <SelectContent>
          {teachers.map((teacher) => (
            <SelectItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
