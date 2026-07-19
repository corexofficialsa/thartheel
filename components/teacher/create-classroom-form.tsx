"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClassroom, type ActionState } from "@/app/(portal)/teacher/classrooms/actions";

export function CreateClassroomForm({ levels }: { levels: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createClassroom, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Classroom name</Label>
        <Input id="name" name="name" placeholder="e.g. Qaida Noorania — Batch A" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="levelId">Level</Label>
        <Select name="levelId" required>
          <SelectTrigger id="levelId" className="w-full">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="meetingLink">Meeting link (optional)</Label>
        <Input id="meetingLink" name="meetingLink" placeholder="https://meet.google.com/..." />
      </div>
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <div className="sm:col-span-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create classroom"}
        </Button>
      </div>
    </form>
  );
}
