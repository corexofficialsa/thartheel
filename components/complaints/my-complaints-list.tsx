import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Complaint } from "@/lib/complaints/actions";

export function MyComplaintsList({ complaints }: { complaints: Complaint[] }) {
  if (complaints.length === 0) {
    return <p className="text-sm text-muted-foreground">You haven&apos;t submitted any complaints.</p>;
  }

  return (
    <div className="space-y-3">
      {complaints.map((complaint) => (
        <Card key={complaint.id}>
          <CardContent className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{complaint.subject}</p>
              <ComplaintStatusBadge status={complaint.status} />
            </div>
            <p className="text-sm text-muted-foreground">{complaint.description}</p>
            {complaint.resolution_note && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="font-medium">Response: </span>
                {complaint.resolution_note}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{new Date(complaint.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
