import { ClassroomRosterManager } from "@/components/classrooms/classroom-roster-manager";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/portal/page-header";

export default async function AdminClassroomsPage() {
  await requireRole("admin");

  return (
    <div className="space-y-6">
      <PageHeader title="Classrooms" description="Create classrooms and assign teachers and students to them." />
      <ClassroomRosterManager />
    </div>
  );
}
