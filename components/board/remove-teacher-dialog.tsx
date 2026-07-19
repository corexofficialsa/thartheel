"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { removeTeacher, type ActionState } from "@/app/(portal)/board/teachers/actions";

export function RemoveTeacherDialog({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(removeTeacher, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="destructive" onClick={() => setOpen(true)}>
        Remove
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove teacher</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="profileId" value={profileId} />
          <div className="space-y-2">
            <Label htmlFor={`reason-${profileId}`}>Reason</Label>
            <Textarea id={`reason-${profileId}`} name="reason" required rows={3} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Removing..." : "Confirm remove"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
