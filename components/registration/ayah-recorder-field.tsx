"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { arabicFont } from "@/lib/fonts";
import { MAX_RECITATION_BYTES } from "@/lib/registration/student-options";

const MAX_DURATION_SECONDS = 90;

function pickMimeType() {
  // Safari/iOS records MP4 (AAC); Chrome/Firefox/Android record WebM.
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
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
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

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
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("recorded");
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        if (fileInputRef.current) {
          const file = new File([blob], type.includes("mp4") ? "recitation.m4a" : "recitation.webm", { type });
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

  // Uploading an existing audio file is an alternative to recording in the
  // browser; either way the audio ends up in the one named file input.
  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("Please choose an audio file.");
      return;
    }
    if (file.size > MAX_RECITATION_BYTES) {
      setError("That file is too large (max 8 MB).");
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
    setStatus("recorded");
    onRecordedChange?.(true);
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
        <Label>Read the ayah below</Label>
        <p className="text-sm text-muted-foreground">
          Recite this ayah aloud and record yourself, or upload an audio recording of it. This helps your teacher
          place you at the right pace.
        </p>
      </div>

      <div className="space-y-2 rounded-xl bg-secondary/50 p-4 text-center">
        <p dir="rtl" lang="ar" className={`${arabicFont.className} text-2xl leading-loose`}>
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

      <div className="flex flex-wrap gap-2">
        {status === "idle" && (
          <>
            <Button type="button" size="sm" onClick={startRecording}>
              <Mic className="size-3.5" /> Start recording
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => uploadInputRef.current?.click()}>
              <Upload className="size-3.5" /> Upload audio
            </Button>
            <input ref={uploadInputRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
          </>
        )}
        {status === "recording" && (
          <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
            <Square className="size-3.5" /> Stop
          </Button>
        )}
        {status === "recorded" && (
          <Button type="button" size="sm" variant="ghost" onClick={reRecord}>
            <RotateCcw className="size-3.5" /> Record again
          </Button>
        )}
      </div>
    </div>
  );
}
