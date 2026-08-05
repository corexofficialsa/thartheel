"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveRegistration, rejectRegistration, type ActionState } from "@/app/(portal)/admin/registrations/actions";

function ApproveForm({ profileId, disabled, disabledReason }: { profileId: string; disabled?: boolean; disabledReason?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(approveRegistration, undefined);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="profileId" value={profileId} />
      <Button type="submit" size="sm" disabled={isPending || disabled} title={disabled ? disabledReason : undefined}>
        {isPending ? "Approving..." : "Approve"}
      </Button>
      {disabled && disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

function RejectDialog({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(rejectRegistration, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Reject
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject registration</DialogTitle>
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
              {isPending ? "Rejecting..." : "Confirm reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RegistrationRowActions({
  profileId,
  approveDisabled,
  approveDisabledReason,
}: {
  profileId: string;
  approveDisabled?: boolean;
  approveDisabledReason?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <ApproveForm profileId={profileId} disabled={approveDisabled} disabledReason={approveDisabledReason} />
      <RejectDialog profileId={profileId} />
    </div>
  );
}
