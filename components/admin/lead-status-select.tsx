"use client";

import { useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateLeadStatus } from "@/app/(portal)/admin/growth/actions";

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateLeadStatus}>
      <input type="hidden" name="leadId" value={leadId} />
      <Select name="status" defaultValue={status} onValueChange={() => formRef.current?.requestSubmit()}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="contacted">Contacted</SelectItem>
          <SelectItem value="converted">Converted</SelectItem>
          <SelectItem value="lost">Lost</SelectItem>
        </SelectContent>
      </Select>
    </form>
  );
}
