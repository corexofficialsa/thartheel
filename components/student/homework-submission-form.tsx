"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaRecorderField } from "@/components/homework/media-recorder-field";
import { submitHomework, type ActionState } from "@/app/(portal)/student/homework/actions";

export function HomeworkSubmissionForm({
  homeworkId,
  studentId,
  existingTextAnswer,
  existingVideoPath,
  existingAudioPath,
}: {
  homeworkId: string;
  studentId: string;
  existingTextAnswer?: string | null;
  existingVideoPath?: string | null;
  existingAudioPath?: string | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(submitHomework, undefined);
  const [videoPath, setVideoPath] = useState<string | null>(existingVideoPath ?? null);
  const [audioPath, setAudioPath] = useState<string | null>(existingAudioPath ?? null);

  const hasExisting = Boolean(existingTextAnswer || existingVideoPath || existingAudioPath);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="homeworkId" value={homeworkId} />
      <input type="hidden" name="videoPath" value={videoPath ?? ""} />
      <input type="hidden" name="audioPath" value={audioPath ?? ""} />

      <div className="space-y-2">
        <Label htmlFor={`answer-${homeworkId}`}>Written answer</Label>
        <Textarea id={`answer-${homeworkId}`} name="textAnswer" defaultValue={existingTextAnswer ?? ""} rows={4} />
      </div>

      <MediaRecorderField
        kind="video"
        studentId={studentId}
        homeworkId={homeworkId}
        existingPath={existingVideoPath}
        onUploaded={setVideoPath}
      />
      <MediaRecorderField
        kind="audio"
        studentId={studentId}
        homeworkId={homeworkId}
        existingPath={existingAudioPath}
        onUploaded={setAudioPath}
      />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : hasExisting ? "Update submission" : "Submit homework"}
      </Button>
    </form>
  );
}
