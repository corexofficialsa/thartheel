"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaRecorderField } from "@/components/homework/media-recorder-field";
import { submitHomework, type ActionState } from "@/app/(portal)/student/homework/actions";
import type { HomeworkMode } from "@/lib/supabase/types";

export function HomeworkSubmissionForm({
  homeworkId,
  studentId,
  allowedModes,
  existingTextAnswer,
  existingVideoPath,
  existingAudioPath,
  onSubmitted,
}: {
  homeworkId: string;
  studentId: string;
  allowedModes: HomeworkMode[];
  existingTextAnswer?: string | null;
  existingVideoPath?: string | null;
  existingAudioPath?: string | null;
  onSubmitted?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(submitHomework, undefined);
  const [videoPath, setVideoPath] = useState<string | null>(existingVideoPath ?? null);
  const [audioPath, setAudioPath] = useState<string | null>(existingAudioPath ?? null);
  const [text, setText] = useState(existingTextAnswer ?? "");

  useEffect(() => {
    if (state?.success) onSubmitted?.();
  }, [state, onSubmitted]);

  const hasExisting = Boolean(existingTextAnswer || existingVideoPath || existingAudioPath);
  const allows = (mode: HomeworkMode) => allowedModes.includes(mode);
  const hasAnswer = Boolean(text.trim() || videoPath || audioPath);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="homeworkId" value={homeworkId} />
      <input type="hidden" name="videoPath" value={allows("video") ? (videoPath ?? "") : ""} />
      <input type="hidden" name="audioPath" value={allows("audio") ? (audioPath ?? "") : ""} />

      {allows("text") && (
        <div className="space-y-2">
          <Label htmlFor={`answer-${homeworkId}`}>Written answer</Label>
          <Textarea
            id={`answer-${homeworkId}`}
            name="textAnswer"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
          />
        </div>
      )}

      {allows("video") && (
        <MediaRecorderField
          kind="video"
          studentId={studentId}
          homeworkId={homeworkId}
          existingPath={existingVideoPath}
          onUploaded={setVideoPath}
        />
      )}
      {allows("audio") && (
        <MediaRecorderField
          kind="audio"
          studentId={studentId}
          homeworkId={homeworkId}
          existingPath={existingAudioPath}
          onUploaded={setAudioPath}
        />
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending || !hasAnswer} className="w-full sm:w-auto">
        {isPending ? "Submitting..." : hasExisting ? "Update submission" : "Submit homework"}
      </Button>
    </form>
  );
}
