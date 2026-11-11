import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { joinClassroom } from "@/lib/classroom/actions";

// The Join button calls this rather than the server action directly: server
// actions run one at a time in a client queue (a slow one blocks the next) and
// fail outright on a tab left open across a deploy, which left the button stuck.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 403 });
  }

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ ok: false, error: "signed_out" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const classroomId = body?.classroomId;
  if (typeof classroomId !== "string") return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  return NextResponse.json(await joinClassroom(classroomId));
}
