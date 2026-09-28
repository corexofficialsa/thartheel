import { ClassroomRosterManager } from "@/components/classrooms/classroom-roster-manager";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/portal/page-header";

export default async function BoardClassroomsPage() {
  await requireRole("board");

  return (
    <div className="space-y-6">
      <PageHeader title="Classrooms" description="Assign approved teachers and students to a classroom." />
      <ClassroomRosterManager />
    </div>
  );
}
