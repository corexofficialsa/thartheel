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
import { deleteStudent } from "@/app/(portal)/admin/students/actions";

export function DeleteStudentButton({ studentId, name }: { studentId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await deleteStudent(studentId);
      if (result.ok) {
        // The refresh runs inside this transition, so the dialog keeps
        // showing "Deleting..." until the updated list (without this row)
        // has arrived — then the row and dialog disappear together.
        setDeleted(true);
        router.refresh();
        toast.success(`${name} was deleted.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open && !(deleted && !isPending)} onOpenChange={(next) => !isPending && setOpen(next)}>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${name}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            This permanently deletes their account, classroom enrollments, attendance, homework, grades, exam results
            and messages. It can&apos;t be undone. Finance ledger entries are kept.
          </DialogDescription>
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
            {isPending ? "Deleting..." : "Delete student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
