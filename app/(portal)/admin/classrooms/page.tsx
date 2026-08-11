import { ClassroomRosterManager } from "@/components/classrooms/classroom-roster-manager";
import { requireRole } from "@/lib/auth/session";

export default async function AdminClassroomsPage() {
  await requireRole("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classrooms</h1>
        <p className="text-muted-foreground">Create classrooms and assign teachers and students to them.</p>
      </div>
      <ClassroomRosterManager />
    </div>
  );
}
