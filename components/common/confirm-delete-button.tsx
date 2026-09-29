"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DeleteResult = { ok: true } | { ok: false; error: string };

// One confirm-then-delete control for every deletable record. `action` is a
// server action already bound to the record's id. The refresh runs inside
// the transition, so the dialog keeps saying "Deleting..." until the updated
// page (without the record) has arrived — then both disappear together.
export function ConfirmDeleteButton({
  action,
  title,
  description,
  successMessage = "Deleted.",
  confirmLabel = "Delete",
  label,
  className,
}: {
  action: () => Promise<DeleteResult>;
  title: string;
  description: string;
  successMessage?: string;
  confirmLabel?: string;
  // Show a text button ("Delete") instead of the default icon button.
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setDeleted(true);
        router.refresh();
        toast.success(successMessage);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open && !(deleted && !isPending)} onOpenChange={(next) => !isPending && setOpen(next)}>
      <Button
        type="button"
        size={label ? "sm" : "icon-sm"}
        variant="ghost"
        className={cn("text-destructive hover:bg-destructive/10 hover:text-destructive", className)}
        aria-label={label ? undefined : title.replace(/\?$/, "")}
        onClick={() => setOpen(true)}
      >
        <Trash2 />
        {label}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
