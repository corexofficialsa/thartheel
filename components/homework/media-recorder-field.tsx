"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const MAX_DURATION_SECONDS = 300; // 5 min cap keeps Storage cost/size bounded
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // homework-submissions bucket limit (0048)
// ~1 Mbps video + 64 kbps audio keeps a full 5-minute recording near 40 MB.
// Browser defaults (~2.5 Mbps+) overran the 50 MB limit after about 2.5 minutes.
const VIDEO_BITS_PER_SECOND = 1_000_000;
const AUDIO_BITS_PER_SECOND = 64_000;

// MP4 first: it plays everywhere (iPhone Safari can't play every WebM), and
// Safari can only record MP4. Chrome/Firefox fall through to WebM.
function pickMimeType(kind: "video" | "audio") {
  const candidates =
    kind === "video"
      ? ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
  return candidates.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
}

function extensionFor(mimeType: string, kind: "video" | "audio") {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  if (base.endsWith("/mp4")) return kind === "audio" ? "m4a" : "mp4";
  if (base.endsWith("/webm")) return "webm";
  if (base === "video/quicktime") return "mov";
  if (base === "audio/mpeg") return "mp3";
  if (base === "audio/x-m4a" || base === "audio/aac") return "m4a";
  if (base === "audio/ogg") return "ogg";
  if (base === "audio/wav" || base === "audio/x-wav") return "wav";
  if (base === "video/3gpp") return "3gp";
  return kind === "video" ? "mp4" : "m4a";
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
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The live <video> only mounts once status is "recording", so attach the
  // camera stream after that render (setting it before left a black box).
  useEffect(() => {
    if (status === "recording" && kind === "video" && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
    }
  }, [status, kind]);

  async function startRecording() {
    setError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't record here. Use “Upload a file” instead, or open the site in Chrome or Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: kind === "video" ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: true,
      });
      streamRef.current = stream;

      const mimeType = pickMimeType(kind);
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
        ...(kind === "video" ? { videoBitsPerSecond: VIDEO_BITS_PER_SECOND } : {}),
      });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        // recorder.mimeType is what the browser actually produced, which can
        // differ from what we asked for (Safari always records MP4).
        const type = recorder.mimeType || mimeType || (kind === "video" ? "video/mp4" : "audio/mp4");
        const blob = new Blob(chunksRef.current, { type });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorderRef.current = recorder;
      // Timeslice so a long recording is flushed in pieces, not one huge buffer.
      recorder.start(1000);
      setStatus("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION_SECONDS && recorder.state === "recording") {
            recorder.stop();
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError(
        `Could not access your ${kind === "video" ? "camera" : "microphone"}. Allow it in your browser settings, or use “Upload a file”.`
      );
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
    setStatus("idle");
    setError(null);
    onUploaded(null);
  }

  async function uploadBlob(blob: Blob) {
    if (blob.size > MAX_UPLOAD_BYTES) {
      setError(
        `This ${kind} is ${(blob.size / 1024 / 1024).toFixed(0)} MB — the limit is 50 MB. Record a shorter one${kind === "video" ? " or lower the camera quality" : ""}.`
      );
      setStatus(previewUrl ? "recorded" : "idle");
      return;
    }
    setStatus("uploading");
    setError(null);

    const contentType = blob.type || (kind === "video" ? "video/mp4" : "audio/mp4");
    const path = `${studentId}/${homeworkId}-${kind}.${extensionFor(contentType, kind)}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("homework-submissions")
      .upload(path, blob, { contentType, upsert: true });

    if (uploadError) {
      setError("Upload failed. Check your connection and try again.");
      setStatus(previewUrl ? "recorded" : "idle");
      return;
    }

    setStatus("uploaded");
    onUploaded(path);
  }

  function upload() {
    if (blobRef.current) void uploadBlob(blobRef.current);
  }

  function handleFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith(`${kind}/`)) {
      setError(`Please choose ${kind === "video" ? "a video" : "an audio"} file.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    blobRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
    void uploadBlob(file);
  }

  const Icon = kind === "video" ? Video : Mic;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4" />
        {kind === "video" ? "Video answer" : "Audio answer"}
      </div>

      {status === "recording" && kind === "video" && (
        <video ref={liveVideoRef} autoPlay muted playsInline className="w-full rounded-md bg-black" />
      )}
      {(status === "recorded" || status === "uploaded" || status === "uploading") && previewUrl && kind === "video" && (
        <video src={previewUrl} controls playsInline className="w-full rounded-md" />
      )}
      {(status === "recorded" || status === "uploaded" || status === "uploading") && previewUrl && kind === "audio" && (
        <audio src={previewUrl} controls className="w-full" />
      )}

      {status === "recording" && (
        <p className="text-xs text-muted-foreground">
          Recording... {elapsed}s / {MAX_DURATION_SECONDS}s
        </p>
      )}
      {status === "uploaded" && !previewUrl && <p className="text-xs text-muted-foreground">Saved from a previous attempt.</p>}
      {status === "uploaded" && previewUrl && <p className="text-xs text-muted-foreground">Uploaded — now press submit.</p>}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={kind === "video" ? "video/*" : "audio/*"}
        className="hidden"
        onChange={handleFilePicked}
      />

      <div className="flex flex-wrap gap-2">
        {status === "idle" && (
          <>
            <Button type="button" size="sm" variant="outline" onClick={startRecording}>
              Start recording
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-3.5" /> Upload a file
            </Button>
          </>
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
            <RotateCcw className="size-3.5" /> Replace
          </Button>
        )}
      </div>
    </div>
  );
}
