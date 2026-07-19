"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createHomework, type ActionState } from "@/app/(portal)/teacher/homework/actions";

export function CreateHomeworkForm({ classrooms }: { classrooms: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createHomework, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="classroomId">Classroom</Label>
        <Select name="classroomId" required>
          <SelectTrigger id="classroomId" className="w-full">
            <SelectValue placeholder="Select classroom" />
          </SelectTrigger>
          <SelectContent>
            {classrooms.map((classroom) => (
              <SelectItem key={classroom.id} value={classroom.id}>
                {classroom.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" name="dueDate" type="datetime-local" required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Memorize Surah Al-Fatiha" required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Instructions (optional)</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Posting..." : "Post homework"}
        </Button>
      </div>
    </form>
  );
}
