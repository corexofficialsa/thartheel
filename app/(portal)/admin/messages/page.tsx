import { ComplaintRow } from "@/components/complaints/complaint-row";
import { getVisibleComplaints } from "@/lib/complaints/actions";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/portal/page-header";

export default async function AdminMessagesPage() {
  await requireRole("admin");
  const complaints = await getVisibleComplaints();

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Support requests from students and teachers." />
      {complaints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No support requests yet.</p>
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
