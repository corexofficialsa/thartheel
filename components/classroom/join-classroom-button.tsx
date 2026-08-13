"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinClassroom } from "@/lib/classroom/actions";

export function JoinClassroomButton({ classroomId, label = "Join Classroom" }: { classroomId: string; label?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    // Mobile browsers (iOS Safari especially) only allow window.open() to
    // succeed when it's called synchronously inside the click handler that
    // triggered it. joinClassroom() is an async server round-trip, so
    // opening the tab only after it resolved silently lost that "user
    // gesture" — the popup was blocked with no error, which read as
    // "attendance recorded, but nothing opens". Opening a blank tab
    // synchronously right here, then redirecting it once we know the real
    // link, keeps it inside the gesture on every browser.
    const pendingTab = window.open("", "_blank");

    startTransition(async () => {
      const result = await joinClassroom(classroomId);

      if (!result.ok) {
        pendingTab?.close();
        toast.error(result.error);
        return;
      }
      if (result.locked) {
        pendingTab?.close();
        toast.error(
          result.reason === "join_window_closed"
            ? "This class is no longer accepting new joins. Ask your teacher to unlock it."
            : "You have incomplete homework due for this class. Complete it first, or ask your teacher for an emergency bypass."
        );
        return;
      }
      if (!result.meetingLink) {
        pendingTab?.close();
        toast.error("No meeting link has been set for this classroom yet.");
        return;
      }

      if (pendingTab) {
        pendingTab.location.href = result.meetingLink;
      } else {
        // Popup blocked outright (e.g. blocker settings) — fall back to
        // navigating the current tab so joining still works.
        window.location.href = result.meetingLink;
      }
      toast.success("Attendance recorded — opening the class.");
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Joining..." : label}
    </Button>
  );
}
