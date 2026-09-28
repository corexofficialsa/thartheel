"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnswerModeCheckboxes } from "@/components/teacher/answer-mode-checkboxes";
import { updateHomework, type ActionState } from "@/app/(portal)/teacher/homework/actions";
import type { HomeworkMode } from "@/lib/supabase/types";

// datetime-local wants local "YYYY-MM-DDTHH:mm", not an ISO UTC string.
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditHomeworkDialog({
  homework,
}: {
  homework: { id: string; title: string; description: string | null; due_date: string; allowed_modes: HomeworkMode[] };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await updateHomework(prev, formData);
    if (!result?.error) {
      setOpen(false);
      toast.success("Homework updated.");
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" /> Edit
      </Button>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit homework</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="homeworkId" value={homework.id} />
          <div className="space-y-2">
            <Label htmlFor={`title-${homework.id}`}>Title</Label>
            <Input id={`title-${homework.id}`} name="title" defaultValue={homework.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`due-${homework.id}`}>Due date</Label>
            <Input
              id={`due-${homework.id}`}
              name="dueDate"
              type="datetime-local"
              defaultValue={toLocalInput(homework.due_date)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`desc-${homework.id}`}>Instructions</Label>
            <Textarea id={`desc-${homework.id}`} name="description" defaultValue={homework.description ?? ""} rows={3} />
          </div>
          <AnswerModeCheckboxes defaultModes={homework.allowed_modes} />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
