"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_DURATION_SECONDS = 90;

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm"];
  return candidates.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
}

export function AyahRecorderField({
  ayah,
  onRecordedChange,
}: {
  ayah: { id: string; reference: string; arabicText: string; translation: string };
  onRecordedChange?: (recorded: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded" | "uploading">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = mimeType ?? "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("recorded");
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        if (fileInputRef.current) {
          const file = new File([blob], "recitation.webm", { type });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
        onRecordedChange?.(true);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION_SECONDS) recorder.stop();
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError("Could not access your microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRecordedChange?.(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="space-y-2">
        <Label>Recitation test</Label>
        <p className="text-sm text-muted-foreground">
          Level 2 asks for a short recitation. Read the ayah below aloud and record yourself reciting it.
        </p>
      </div>

      <div className="space-y-2 rounded-xl bg-secondary/50 p-4 text-center">
        <p dir="rtl" lang="ar" className="text-2xl leading-relaxed font-medium">
          {ayah.arabicText}
        </p>
        <p className="text-sm text-muted-foreground">{ayah.translation}</p>
        <p className="text-xs text-muted-foreground">{ayah.reference}</p>
      </div>

      <input ref={fileInputRef} type="file" name="recitationAudio" className="hidden" />
      <input type="hidden" name="recitationAyahId" value={ayah.id} />

      {status === "recorded" && previewUrl && <audio src={previewUrl} controls className="w-full" />}
      {status === "recording" && (
        <p className="text-xs text-muted-foreground">
          Recording... {elapsed}s / {MAX_DURATION_SECONDS}s
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        {status === "idle" && (
          <Button type="button" size="sm" variant="outline" onClick={startRecording}>
            <Mic className="size-3.5" /> Start recording
          </Button>
        )}
        {status === "recording" && (
          <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
            <Square className="size-3.5" /> Stop
          </Button>
        )}
        {status === "recorded" && (
          <Button type="button" size="sm" variant="ghost" onClick={reRecord}>
            <RotateCcw className="size-3.5" /> Re-record
          </Button>
        )}
      </div>
    </div>
  );
}
