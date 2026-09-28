import { StudentProgressTable } from "@/components/students/student-progress-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStudentsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .eq("status", "active");
  const studentIds = (students ?? []).map((s) => s.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-muted-foreground">Every active student with their phase, attendance, and grades.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student progress</CardTitle>
          <CardDescription>{studentIds.length} active students</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentProgressTable studentIds={studentIds} />
        </CardContent>
      </Card>
    </div>
  );
}
