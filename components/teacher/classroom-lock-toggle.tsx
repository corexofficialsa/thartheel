"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setClassroomJoinLock } from "@/lib/classroom/actions";

export function ClassroomLockToggle({
  classroomId,
  effectivelyLocked,
  isManualOverride,
}: {
  classroomId: string;
  effectivelyLocked: boolean;
  isManualOverride: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function setLock(locked: boolean) {
    startTransition(async () => {
      const result = await setClassroomJoinLock(classroomId, locked);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={effectivelyLocked ? "destructive" : "default"}>
        {effectivelyLocked ? "Joining locked" : "Joining open"}
      </Badge>
      {!isManualOverride && !effectivelyLocked && (
        <span className="text-xs text-muted-foreground">auto-locks 20 min after you join</span>
      )}
      {effectivelyLocked ? (
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => setLock(false)}>
          Unlock joining
        </Button>
      ) : (
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => setLock(true)}>
          Lock joining
        </Button>
      )}
    </div>
  );
}
