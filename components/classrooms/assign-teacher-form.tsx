"use client";

import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignTeacher } from "@/lib/classrooms/actions";

export function AssignTeacherForm({
  classroomId,
  currentTeacherId,
  teachers,
}: {
  classroomId: string;
  currentTeacherId: string;
  teachers: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionToast(assignTeacher, "Teacher assigned.");

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
