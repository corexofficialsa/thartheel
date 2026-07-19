import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherDetailPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, name, email, phone, whatsapp_number, level_id, status")
    .eq("id", teacherId)
    .eq("role", "teacher")
    .single();

  if (!teacher) notFound();

  const [{ data: levels }, { data: classrooms }] = await Promise.all([
    supabase.from("levels").select("id, name"),
    supabase.from("classrooms").select("id, name").eq("teacher_id", teacherId),
  ]);
  const levelName = teacher.level_id ? (levels ?? []).find((l) => l.id === teacher.level_id)?.name : null;
  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const classroomNameById = new Map((classrooms ?? []).map((c) => [c.id, c.name]));

  const { data: attendance } =
    classroomIds.length > 0
      ? await supabase
          .from("attendance")
          .select("id, classroom_id, date, joined_at")
          .eq("user_id", teacherId)
          .order("date", { ascending: false })
          .limit(50)
      : { data: [] as { id: string; classroom_id: string; date: string; joined_at: string }[] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{teacher.name}</h1>
        <p className="text-muted-foreground">{teacher.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Phone:</span> {teacher.phone ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">WhatsApp:</span> {teacher.whatsapp_number ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Level:</span> {levelName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Status:</span>{" "}
            <Badge variant={teacher.status === "active" ? "default" : "secondary"}>{teacher.status}</Badge>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classrooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {(classrooms ?? []).length === 0 && <p className="text-muted-foreground">No classrooms assigned.</p>}
          {(classrooms ?? []).map((c) => (
            <p key={c.id}>{c.name}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance history</CardTitle>
          <CardDescription>Most recent 50 records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {(!attendance || attendance.length === 0) && <p className="text-muted-foreground">No attendance recorded.</p>}
          {(attendance ?? []).map((row) => (
            <div key={row.id} className="flex items-center justify-between border-b py-1 last:border-0">
              <span>{classroomNameById.get(row.classroom_id) ?? "Classroom"}</span>
              <span className="text-muted-foreground">{new Date(row.date).toLocaleDateString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
