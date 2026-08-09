import { ComplaintRow } from "@/components/complaints/complaint-row";
import { getVisibleComplaints } from "@/lib/complaints/actions";
import { requireRole } from "@/lib/auth/session";

export default async function AdminMessagesPage() {
  await requireRole("admin");
  const complaints = await getVisibleComplaints();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-muted-foreground">Complaints submitted by students and teachers.</p>
      </div>
      {complaints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No complaints yet.</p>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <ComplaintRow key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}
