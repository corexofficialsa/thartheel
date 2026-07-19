"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const MAX_DURATION_SECONDS = 300; // 5 min cap keeps Storage cost/size bounded

function pickMimeType(kind: "video" | "audio") {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["audio/webm;codecs=opus", "audio/webm"];
  return candidates.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
}

export function MediaRecorderField({
  kind,
  studentId,
  homeworkId,
  existingPath,
  onUploaded,
}: {
  kind: "video" | "audio";
  studentId: string;
  homeworkId: string;
  existingPath?: string | null;
  onUploaded: (path: string | null) => void;
}) {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded" | "uploading" | "uploaded">(
    existingPath ? "uploaded" : "idle"
  );
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: kind === "video",
        audio: true,
      });
      streamRef.current = stream;

      if (previewRef.current && kind === "video") {
        (previewRef.current as HTMLVideoElement).srcObject = stream;
      }

      const mimeType = pickMimeType(kind);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType ?? (kind === "video" ? "video/webm" : "audio/webm") });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("recorded");
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION_SECONDS) {
            recorder.stop();
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError(`Could not access your ${kind === "video" ? "camera" : "microphone"}. Check browser permissions.`);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("idle");
    onUploaded(null);
  }

  async function upload() {
    if (chunksRef.current.length === 0) return;
    setStatus("uploading");
    setError(null);

    const mimeType = pickMimeType(kind) ?? (kind === "video" ? "video/webm" : "audio/webm");
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const path = `${studentId}/${homeworkId}-${kind}.webm`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("homework-submissions")
      .upload(path, blob, { contentType: mimeType, upsert: true });

    if (uploadError) {
      setError("Upload failed. Please try again.");
      setStatus("recorded");
      return;
    }

    setStatus("uploaded");
    onUploaded(path);
  }

  const Icon = kind === "video" ? Video : Mic;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4" />
        {kind === "video" ? "Video answer" : "Audio answer"}
      </div>

      {status === "recording" && kind === "video" && (
        <video ref={previewRef as React.RefObject<HTMLVideoElement>} autoPlay muted className="w-full rounded-md bg-black" />
      )}
      {status === "recorded" && previewUrl && kind === "video" && (
        <video src={previewUrl} controls className="w-full rounded-md" />
      )}
      {status === "recorded" && previewUrl && kind === "audio" && <audio src={previewUrl} controls className="w-full" />}

      {status === "recording" && (
        <p className="text-xs text-muted-foreground">
          Recording... {elapsed}s / {MAX_DURATION_SECONDS}s
        </p>
      )}
      {status === "uploaded" && !previewUrl && <p className="text-xs text-muted-foreground">Saved from a previous attempt.</p>}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        {status === "idle" && (
          <Button type="button" size="sm" variant="outline" onClick={startRecording}>
            Start recording
          </Button>
        )}
        {status === "recording" && (
          <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
            <Square className="size-3.5" /> Stop
          </Button>
        )}
        {status === "recorded" && (
          <>
            <Button type="button" size="sm" onClick={upload}>
              Use this recording
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reRecord}>
              <RotateCcw className="size-3.5" /> Re-record
            </Button>
          </>
        )}
        {status === "uploading" && (
          <Button type="button" size="sm" disabled>
            Uploading...
          </Button>
        )}
        {status === "uploaded" && (
          <Button type="button" size="sm" variant="ghost" onClick={reRecord}>
            <RotateCcw className="size-3.5" /> Re-record
          </Button>
        )}
      </div>
    </div>
  );
}
