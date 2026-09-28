"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HomeworkSubmissionForm } from "@/components/student/homework-submission-form";
import type { HomeworkMode } from "@/lib/supabase/types";

const MODE_LABEL: Record<HomeworkMode, string> = { text: "written", audio: "audio", video: "video" };

export function HomeworkSubmitDialog({
  homeworkId,
  title,
  studentId,
  allowedModes,
  existingTextAnswer,
  existingVideoPath,
  existingAudioPath,
}: {
  homeworkId: string;
  title: string;
  studentId: string;
  allowedModes: HomeworkMode[];
  existingTextAnswer?: string | null;
  existingVideoPath?: string | null;
  existingAudioPath?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const hasExisting = Boolean(existingTextAnswer || existingVideoPath || existingAudioPath);

  const handleSubmitted = useCallback(() => {
    setOpen(false);
    toast.success("Homework submitted.");
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        {hasExisting ? "Edit submission" : "Submit homework"}
      </Button>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Answer with {allowedModes.map((m) => MODE_LABEL[m]).join(", ")}
            {allowedModes.length > 1 ? " — any one is enough." : "."}
          </DialogDescription>
        </DialogHeader>
        <HomeworkSubmissionForm
          homeworkId={homeworkId}
          studentId={studentId}
          allowedModes={allowedModes}
          existingTextAnswer={existingTextAnswer}
          existingVideoPath={existingVideoPath}
          existingAudioPath={existingAudioPath}
          onSubmitted={handleSubmitted}
        />
      </DialogContent>
    </Dialog>
  );
}
