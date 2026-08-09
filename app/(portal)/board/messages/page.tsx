import { ChatInterface, type ChatContact } from "@/components/chat/chat-interface";
import { ComplaintRow } from "@/components/complaints/complaint-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVisibleComplaints } from "@/lib/complaints/actions";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function BoardMessagesPage() {
  const profile = await requireRole("board");
  const supabase = await createClient();

  const [complaints, { data: teachers }] = await Promise.all([
    getVisibleComplaints(),
    supabase.from("profiles").select("id, name").eq("role", "teacher").eq("status", "active"),
  ]);

  const contacts: ChatContact[] = (teachers ?? []).map((t) => ({ id: t.id, name: t.name, subtitle: "Teacher" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-muted-foreground">Complaints and direct messages with teachers.</p>
      </div>

      <Tabs defaultValue="complaints">
        <TabsList>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="chat">Teacher Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints" className="space-y-3">
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complaints yet.</p>
          ) : (
            complaints.map((complaint) => <ComplaintRow key={complaint.id} complaint={complaint} />)
          )}
        </TabsContent>

        <TabsContent value="chat">
          <ChatInterface currentUserId={profile.id} contacts={contacts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
