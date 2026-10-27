"use client";

import { useActionState, useState } from "react";
import { DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { grantClassAccess, type ActionState } from "@/app/(portal)/teacher/classrooms/actions";

export function GrantClassAccessDialog({
  classroomId,
  studentId,
  studentName,
  missingCount,
}: {
  classroomId: string;
  studentId: string;
  studentName: string;
  missingCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await grantClassAccess(prev, formData);
    if (!result?.error) {
      setOpen(false);
      toast.success(`${studentName} can join the next class.`);
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <DoorOpen className="size-3.5" /> Grant access
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Let {studentName} into class?</DialogTitle>
          <DialogDescription>
            They have {missingCount} overdue homework {missingCount === 1 ? "assignment" : "assignments"} not submitted, so
            the Join button is blocked for them. This pass lets them join once — it&apos;s used up the next time they join.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="classroomId" value={classroomId} />
          <input type="hidden" name="studentId" value={studentId} />
          <div className="space-y-2">
            <Label htmlFor={`reason-${classroomId}-${studentId}`}>Reason</Label>
            <Textarea
              id={`reason-${classroomId}-${studentId}`}
              name="reason"
              rows={2}
              maxLength={500}
              placeholder="e.g. Was ill; video upload failed on their phone"
              required
            />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Granting..." : "Grant access"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
