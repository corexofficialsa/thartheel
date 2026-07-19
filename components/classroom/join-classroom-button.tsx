"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinClassroom } from "@/lib/classroom/actions";

export function JoinClassroomButton({ classroomId, label = "Join Classroom" }: { classroomId: string; label?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await joinClassroom(classroomId);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.locked) {
        toast.error(
          "You have incomplete homework due for this class. Complete it first, or ask your teacher for an emergency bypass."
        );
        return;
      }
      if (!result.meetingLink) {
        toast.error("No meeting link has been set for this classroom yet.");
        return;
      }

      window.open(result.meetingLink, "_blank", "noopener,noreferrer");
      toast.success("Attendance recorded — opening the class.");
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Joining..." : label}
    </Button>
  );
}
