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
    <div className="inline-flex shrink-0 rounded-lg border p-0.5" aria-busy={isPending}>
      <button
        type="button"
        onClick={() => set(true)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors md:h-8 md:px-2.5 md:text-xs",
          optimisticPresent ? "bg-success text-white" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <Check className="size-3.5" /> Present
      </button>
      <button
        type="button"
        onClick={() => set(false)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors md:h-8 md:px-2.5 md:text-xs",
          !optimisticPresent ? "bg-destructive text-white" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <X className="size-3.5" /> Absent
      </button>
    </div>
  );
}
