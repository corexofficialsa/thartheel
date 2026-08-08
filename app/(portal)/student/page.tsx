import { BarChart3, CalendarCheck, ClipboardList, Flame } from "lucide-react";
import { StatCard } from "@/components/portal/stat-card";
import { LeaderboardCard } from "@/components/student/leaderboard-card";
import { requireRole } from "@/lib/auth/session";
import { computeStreak } from "@/lib/attendance/streak";
import { createClient } from "@/lib/supabase/server";

export default async function StudentHomePage() {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: enrollments } = await supabase
    .from("classroom_students")
    .select("classroom_id")
    .eq("student_id", profile.id);
  const classroomIds = (enrollments ?? []).map((e) => e.classroom_id);

  const [{ count: attendanceCount }, { data: homeworkList }, { data: allAttendance }, { data: leaderboard }] =
    await Promise.all([
      supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("date", startOfMonth.toISOString().slice(0, 10)),
      classroomIds.length > 0
        ? supabase.from("homework").select("id").in("classroom_id", classroomIds)
        : Promise.resolve({ data: [] as { id: string }[] }),
      supabase.from("attendance").select("date").eq("user_id", profile.id).order("date", { ascending: false }),
      supabase.rpc("top_student_leaderboard"),
    ]);

  const homeworkIds = (homeworkList ?? []).map((h) => h.id);
  const { data: submitted } =
    homeworkIds.length > 0
      ? await supabase.from("homework_submissions").select("homework_id").eq("student_id", profile.id).in("homework_id", homeworkIds)
      : { data: [] as { homework_id: string }[] };
  const submittedIds = new Set((submitted ?? []).map((s) => s.homework_id));
  const pendingCount = homeworkIds.filter((id) => !submittedIds.has(id)).length;

  const { data: firstTrack } = await supabase.from("syllabus_tracks").select("id, name, total_milestones").limit(1).single();
  let milestoneLabel = "—";
  if (firstTrack) {
    const { data: studentMilestones } = await supabase
      .from("student_milestones")
      .select("milestone_index")
      .eq("student_id", profile.id)
      .eq("track_id", firstTrack.id);
    const current = (studentMilestones ?? []).reduce((max, m) => Math.max(max, m.milestone_index), 0);
    milestoneLabel = `${current}/${firstTrack.total_milestones}`;
  }

  const distinctDates = [...new Set((allAttendance ?? []).map((a) => a.date))];
  const streak = computeStreak(distinctDates);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assalamu Alaikum, {profile.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Here&apos;s your progress at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Attendance streak" value={streak} suffix={streak === 1 ? " day" : " days"} />
        <StatCard icon={CalendarCheck} label="Attendance this month" value={attendanceCount ?? 0} />
        <StatCard icon={ClipboardList} label="Homework pending" value={pendingCount} />
        <StatCard
          icon={BarChart3}
          label={firstTrack?.name ?? "Current milestone"}
          value={milestoneLabel}
          href="/student/progress"
        />
      </div>

      <LeaderboardCard entries={leaderboard ?? []} currentStudentId={profile.id} />
    </div>
  );
}
