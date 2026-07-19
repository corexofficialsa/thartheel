"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadVisitReport, type ActionState } from "@/app/(portal)/admin/visit-reports/actions";

export function UploadVisitReportForm({ classrooms }: { classrooms: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(uploadVisitReport, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <Input name="title" placeholder="Report title" required />
      <Select name="classroomId">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Classroom (optional)" />
        </SelectTrigger>
        <SelectContent>
          {classrooms.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="visitedAt" type="date" />
      <Input name="file" type="file" accept="image/*,.pdf" />
      <Textarea name="notes" placeholder="Inspection notes..." rows={3} className="sm:col-span-2" />
      {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Uploading..." : "Save report"}
        </Button>
      </div>
    </form>
  );
}
