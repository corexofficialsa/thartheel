"use client";

import { useOptimistic, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { setAttendance } from "@/lib/attendance/actions";
import { cn } from "@/lib/utils";

export function AttendanceToggle({
  classroomId,
  studentId,
  date,
  present,
}: {
  classroomId: string;
  studentId: string;
  date: string;
  present: boolean;
}) {
  const [optimisticPresent, setOptimisticPresent] = useOptimistic(present);
  const [isPending, startTransition] = useTransition();

  function set(next: boolean) {
    if (next === optimisticPresent) return;
    startTransition(async () => {
      setOptimisticPresent(next);
      const result = await setAttendance(classroomId, studentId, date, next);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="inline-flex rounded-lg border p-0.5" aria-busy={isPending}>
      <button
        type="button"
        onClick={() => set(true)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          optimisticPresent ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <Check className="size-3.5" /> Present
      </button>
      <button
        type="button"
        onClick={() => set(false)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          !optimisticPresent ? "bg-destructive text-white" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <X className="size-3.5" /> Absent
      </button>
    </div>
  );
}
