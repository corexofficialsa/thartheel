"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateMeetingLink, type ActionState } from "@/app/(portal)/teacher/classrooms/actions";

export function MeetingLinkForm({ classroomId, meetingLink }: { classroomId: string; meetingLink: string | null }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateMeetingLink, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="classroomId" value={classroomId} />
      <Input
        name="meetingLink"
        defaultValue={meetingLink ?? ""}
        placeholder="https://meet.google.com/..."
        className="min-w-56 flex-1"
      />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Saving..." : "Save link"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
