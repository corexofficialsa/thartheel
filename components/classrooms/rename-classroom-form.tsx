"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameClassroom, type ActionState } from "@/lib/classrooms/actions";

export function RenameClassroomForm({ classroomId, currentName }: { classroomId: string; currentName: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await renameClassroom(prev, formData);
    if (!result?.error) setEditing(false);
    return result;
  }, undefined);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-heading text-base font-medium">{currentName}</span>
        <Button type="button" size="icon-sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Rename classroom">
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="classroomId" value={classroomId} />
      <Input name="name" defaultValue={currentName} className="h-8 w-56" autoFocus required />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
