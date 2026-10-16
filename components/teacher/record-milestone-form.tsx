"use client";

import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recordMilestone } from "@/app/(portal)/teacher/academics/actions";

export function RecordMilestoneForm({
  students,
  tracks,
}: {
  students: { id: string; name: string }[];
  tracks: { id: string; name: string; total_milestones: number }[];
}) {
  const [state, formAction, isPending] = useActionToast(recordMilestone, "Phase recorded.");

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <Select name="studentId" required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Student" />
        </SelectTrigger>
        <SelectContent>
          {students.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select name="trackId" required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Track" />
        </SelectTrigger>
        <SelectContent>
          {tracks.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="milestoneIndex" type="number" min={1} placeholder="Phase #" required />
      {state?.error && <p className="text-sm text-destructive sm:col-span-4">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Record phase"}
      </Button>
    </form>
  );
}
