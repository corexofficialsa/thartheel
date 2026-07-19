import { ChatInterface, type ChatContact } from "@/components/chat/chat-interface";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherChatPage() {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: classrooms } = await supabase.from("classrooms").select("id").eq("teacher_id", profile.id);
  const classroomIds = (classrooms ?? []).map((c) => c.id);

  const [{ data: enrollments }, { data: board }] = await Promise.all([
    classroomIds.length > 0
      ? supabase.from("classroom_students").select("student_id").in("classroom_id", classroomIds)
      : Promise.resolve({ data: [] as { student_id: string }[] }),
    supabase.from("profiles").select("id, name").eq("role", "board").eq("status", "active"),
  ]);

  const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
  const { data: students } =
    studentIds.length > 0 ? await supabase.from("profiles").select("id, name").in("id", studentIds) : { data: [] as { id: string; name: string }[] };

  const contacts: ChatContact[] = [
    ...(students ?? []).map((s) => ({ id: s.id, name: s.name, subtitle: "Student" })),
    ...(board ?? []).map((b) => ({ id: b.id, name: b.name, subtitle: "Board Committee" })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-muted-foreground">Message your students or the board committee.</p>
      </div>
      <ChatInterface currentUserId={profile.id} contacts={contacts} />
    </div>
  );
}
