import { ChatInterface, type ChatContact } from "@/components/chat/chat-interface";
import { MyComplaintsList } from "@/components/complaints/my-complaints-list";
import { SubmitComplaintForm } from "@/components/complaints/submit-complaint-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVisibleComplaints } from "@/lib/complaints/actions";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function StudentChatPage() {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("classroom_students")
    .select("classroom_id")
    .eq("student_id", profile.id);
  const classroomIds = (enrollments ?? []).map((e) => e.classroom_id);

  const [{ data: classrooms }, complaints] = await Promise.all([
    classroomIds.length > 0
      ? supabase.from("classrooms").select("teacher_id").in("id", classroomIds)
      : Promise.resolve({ data: [] as { teacher_id: string }[] }),
    getVisibleComplaints(),
  ]);
  const teacherIds = [...new Set((classrooms ?? []).map((c) => c.teacher_id))];

  const { data: teachers } =
    teacherIds.length > 0 ? await supabase.from("profiles").select("id, name").in("id", teacherIds) : { data: [] as { id: string; name: string }[] };

  const contacts: ChatContact[] = (teachers ?? []).map((t) => ({ id: t.id, name: t.name, subtitle: "Teacher" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-muted-foreground">Message your teacher, or raise a complaint with admin.</p>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <ChatInterface currentUserId={profile.id} contacts={contacts} />
        </TabsContent>

        <TabsContent value="complaints" className="space-y-6">
          <SubmitComplaintForm />
          <MyComplaintsList complaints={complaints} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
