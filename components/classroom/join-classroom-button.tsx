"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { JoinClassroomResult } from "@/lib/classroom/actions";

const JOIN_TIMEOUT_MS = 20000;

// Saved links are free text, so "meet.google.com/abc" must not be treated as a
// path on this site, and anything other than a web link must not be opened.
function normalizeMeetingLink(link: string) {
  const trimmed = link.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

type Notice = { message: string; href?: string; linkLabel?: string };

export function JoinClassroomButton({ classroomId, label = "Join Classroom" }: { classroomId: string; label?: string }) {
  const [isPending, setIsPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [openLink, setOpenLink] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setNotice(null);
    setOpenLink(null);

    // Deliberately no blank tab opened up front: on phones it pushes this page
    // into the background, where the browser can pause it mid-request, leaving
    // an empty tab and a button stuck on "Joining...".
    let result: JoinClassroomResult | { ok: false; error: "signed_out" };
    try {
      const response = await fetch("/api/classroom/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId }),
        signal: AbortSignal.timeout(JOIN_TIMEOUT_MS),
      });
      result = await response.json();
    } catch {
      setNotice({ message: "The connection is too slow or was lost. Check your internet and press Join again." });
      setIsPending(false);
      return;
    }
    setIsPending(false);

    if (!result.ok) {
      setNotice(
        result.error === "signed_out"
          ? { message: "You've been signed out.", href: "/login", linkLabel: "Log in again" }
          : { message: result.error }
      );
      return;
    }
    if (result.locked) {
      setNotice(
        result.reason === "join_window_closed"
          ? { message: "This class is no longer accepting new joins. Ask your teacher to unlock it." }
          : {
              message: "You can't join yet: you have overdue homework for this class that wasn't submitted. Submit it, or ask your teacher to grant you access.",
              href: "/student/homework",
              linkLabel: "Go to homework",
            }
      );
      return;
    }

    const meetingLink = result.meetingLink ? normalizeMeetingLink(result.meetingLink) : null;
    if (!meetingLink) {
      setNotice({
        message: result.meetingLink
          ? "The meeting link for this classroom isn't valid. Ask your teacher to check it."
          : "No meeting link has been set for this classroom yet.",
      });
      return;
    }

    // Attendance is recorded, so nothing is left to pause. The real link below
    // stays as the fallback wherever the browser refuses to open a new tab.
    setOpenLink(meetingLink);
    const tab = window.open(meetingLink, "_blank");
    if (!tab) window.location.assign(meetingLink);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Joining..." : label}
      </Button>
      {openLink && (
        <p className="text-xs text-muted-foreground">
          Attendance recorded.{" "}
          <a href={openLink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">
            Open the class
          </a>{" "}
          if it didn&apos;t open.
        </p>
      )}
      {notice && (
        <p role="alert" className="text-xs text-destructive">
          {notice.message}{" "}
          {notice.href && (
            <Link href={notice.href} className="font-medium underline underline-offset-4">
              {notice.linkLabel}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
