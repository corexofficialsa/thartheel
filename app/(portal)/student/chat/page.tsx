import { ChatInterface, type ChatContact } from "@/components/chat/chat-interface";
import { MyComplaintsList } from "@/components/complaints/my-complaints-list";
import { SubmitComplaintForm } from "@/components/complaints/submit-complaint-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVisibleComplaints } from "@/lib/complaints/actions";
import { requireRole } from "@/lib/auth/session";
import { getUnreadByContact } from "@/lib/notifications/counts";
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
      ? supabase.from("classrooms").select("id, name, teacher_id").in("id", classroomIds)
      : Promise.resolve({ data: [] as { id: string; name: string; teacher_id: string }[] }),
    getVisibleComplaints(),
  ]);
  const teacherIds = [...new Set((classrooms ?? []).map((c) => c.teacher_id))];

  const { data: teachers } =
    teacherIds.length > 0 ? await supabase.from("profiles").select("id, name").in("id", teacherIds) : { data: [] as { id: string; name: string }[] };

  const contacts: ChatContact[] = [
    ...(teachers ?? []).map((t) => ({ id: t.id, name: t.name, subtitle: "Teacher" })),
    ...(classrooms ?? []).map((c) => ({ id: c.id, name: c.name, subtitle: "Classroom chat", kind: "classroom" as const })),
  ];

  const unreadByContact = await getUnreadByContact(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-muted-foreground">Message your teacher, or reach admin through Support.</p>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="complaints">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <ChatInterface currentUserId={profile.id} contacts={contacts} unreadByContact={unreadByContact} />
        </TabsContent>

        <TabsContent value="complaints" className="space-y-6">
          <SubmitComplaintForm />
          <MyComplaintsList complaints={complaints} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
