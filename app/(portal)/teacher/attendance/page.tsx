import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceToggle } from "@/components/teacher/attendance-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isIsoDate, riyadhToday } from "@/lib/attendance/dates";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shiftMonth(date: string, delta: number) {
  const [y, m] = date.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await requireRole("teacher");
  const params = await searchParams;
  const supabase = await createClient();

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name")
    .eq("teacher_id", profile.id)
    .order("name");

  if (!classrooms || classrooms.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-muted-foreground">You don&apos;t have a classroom yet.</p>
      </div>
    );
  }

  const classroomId =
    typeof params.classroom === "string" && classrooms.some((c) => c.id === params.classroom)
      ? params.classroom
      : classrooms[0].id;
  const today = riyadhToday();
  const date = isIsoDate(params.date) ? params.date : today;
  const monthStart = `${date.slice(0, 7)}-01`;
  const nextMonthStart = shiftMonth(date, 1);

  const [{ data: enrollments }, { data: monthRows }] = await Promise.all([
    supabase.from("classroom_students").select("student_id").eq("classroom_id", classroomId),
    supabase
      .from("attendance")
      .select("user_id, date, role")
      .eq("classroom_id", classroomId)
      .gte("date", monthStart)
      .lt("date", nextMonthStart),
  ]);
  const studentIds = (enrollments ?? []).map((e) => e.student_id);
  const { data: students } =
    studentIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", studentIds).order("name")
      : { data: [] as { id: string; name: string }[] };

  const presentOnDate = new Set(
    (monthRows ?? []).filter((r) => r.date === date && r.role === "student").map((r) => r.user_id)
  );
  const presentCount = (students ?? []).filter((s) => presentOnDate.has(s.id)).length;
  const absentCount = (students ?? []).length - presentCount;

  const studentsByDay = new Map<string, number>();
  const teacherDays = new Set<string>();
  for (const r of monthRows ?? []) {
    if (r.role === "teacher") teacherDays.add(r.date);
    else studentsByDay.set(r.date, (studentsByDay.get(r.date) ?? 0) + 1);
  }

  const [year, month] = date.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const href = (next: { classroom?: string; date?: string }) =>
    `/teacher/attendance?classroom=${next.classroom ?? classroomId}&date=${next.date ?? date}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-muted-foreground">See who attended, correct records, and browse past days.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {classrooms.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={c.id === classroomId ? "default" : "outline"}
            nativeButton={false}
            render={<Link href={href({ classroom: c.id })} prefetch={false} />}
          >
            {c.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>
                {new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}
                {date === today && " · Today"}
              </CardTitle>
              <CardDescription>
                <span className="text-emerald-600 dark:text-emerald-400">{presentCount} present</span> ·{" "}
                <span className="text-destructive">{absentCount} absent</span>
              </CardDescription>
            </div>
            <form className="flex items-center gap-2">
              <input type="hidden" name="classroom" value={classroomId} />
              <Input type="date" name="date" defaultValue={date} max={today} className="h-8 w-40" />
              <Button type="submit" size="sm" variant="outline">
                Go
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            {(students ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No students enrolled in this classroom yet.</p>
            ) : (
              <ul className="divide-y">
                {(students ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm font-medium">{s.name}</span>
                    <AttendanceToggle
                      classroomId={classroomId}
                      studentId={s.id}
                      date={date}
                      present={presentOnDate.has(s.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{monthLabel}</CardTitle>
            <div className="flex gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                nativeButton={false}
                render={<Link href={href({ date: shiftMonth(date, -1) })} prefetch={false} aria-label="Previous month" />}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                nativeButton={false}
                render={<Link href={href({ date: shiftMonth(date, 1) })} prefetch={false} aria-label="Next month" />}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1 text-muted-foreground">
                  {d}
                </div>
              ))}
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = `${date.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`;
                const count = studentsByDay.get(day) ?? 0;
                const held = teacherDays.has(day) || count > 0;
                const future = day > today;
                return (
                  <Link
                    key={day}
                    href={href({ date: day })}
                    prefetch={false}
                    aria-disabled={future}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-lg transition-colors",
                      future ? "pointer-events-none text-muted-foreground/40" : "hover:bg-muted",
                      held && !future && "bg-primary/10 text-primary",
                      day === date && "ring-2 ring-primary"
                    )}
                  >
                    <span className="font-medium">{i + 1}</span>
                    {held && <span className="text-[10px] leading-none">{count}</span>}
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Highlighted days had class; the number is how many students attended.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
