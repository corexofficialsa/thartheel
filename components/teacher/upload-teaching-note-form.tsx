"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadTeachingNote, type ActionState } from "@/app/(portal)/teacher/academics/actions";

export function UploadTeachingNoteForm({ levels }: { levels: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(uploadTeachingNote, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <Input name="title" placeholder="Note title" required className="sm:col-span-2" />
      <Select name="levelId">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Level (optional)" />
        </SelectTrigger>
        <SelectContent>
          {levels.map((level) => (
            <SelectItem key={level.id} value={level.id}>
              {level.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="file" type="file" required />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Uploading..." : "Upload note"}
      </Button>
    </form>
  );
}
