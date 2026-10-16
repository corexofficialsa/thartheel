"use client";

import { useActionToast } from "@/lib/use-action-toast";
import { CopyButton } from "@/components/common/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateMeetingLink } from "@/app/(portal)/teacher/classrooms/actions";

export function MeetingLinkForm({ classroomId, meetingLink }: { classroomId: string; meetingLink: string | null }) {
  const [state, formAction, isPending] = useActionToast(updateMeetingLink, "Meeting link saved.");

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="classroomId" value={classroomId} />
      <Input
        name="meetingLink"
        defaultValue={meetingLink ?? ""}
        placeholder="https://meet.google.com/..."
        className="min-w-56 flex-1"
      />
      {meetingLink && <CopyButton value={meetingLink} label="Copy meeting link" />}
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Saving..." : "Save link"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
