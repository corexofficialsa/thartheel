import { ClassroomRosterManager } from "@/components/classrooms/classroom-roster-manager";
import { requireRole } from "@/lib/auth/session";

export default async function BoardClassroomsPage() {
  await requireRole("board");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classrooms</h1>
        <p className="text-muted-foreground">Assign approved teachers and students to a classroom.</p>
      </div>
      <ClassroomRosterManager />
    </div>
  );
}
