"use client";

import { useActionState } from "react";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateComplaintStatus, type Complaint, type UpdateComplaintState } from "@/lib/complaints/actions";

export function ComplaintRow({ complaint }: { complaint: Complaint }) {
  const [state, formAction, isPending] = useActionState<UpdateComplaintState, FormData>(
    updateComplaintStatus,
    undefined
  );

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{complaint.subject}</p>
            <p className="text-xs text-muted-foreground">
              {complaint.submitted_by_name} &middot; <span className="capitalize">{complaint.submitted_by_role}</span> &middot;{" "}
              {new Date(complaint.created_at).toLocaleDateString()}
            </p>
          </div>
          <ComplaintStatusBadge status={complaint.status} />
        </div>
        <p className="text-sm text-muted-foreground">{complaint.description}</p>

        <form action={formAction} className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-start">
          <input type="hidden" name="complaintId" value={complaint.id} />
          <Select name="status" required defaultValue={complaint.status}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            name="resolutionNote"
            placeholder="Response / resolution note (optional)"
            defaultValue={complaint.resolution_note ?? ""}
            rows={1}
          />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}
