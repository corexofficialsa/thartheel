import { RemoveStudentDialog } from "@/components/board/remove-student-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export default async function BoardStudentsPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: levels }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, level_id, status").eq("role", "student").order("name"),
    supabase.from("levels").select("id, name"),
  ]);
  const levelNameById = new Map((levels ?? []).map((l) => [l.id, l.name]));

  const studentIds = (students ?? []).map((s) => s.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: attendanceRows } =
    studentIds.length > 0
      ? await supabase
          .from("attendance")
          .select("user_id")
          .in("user_id", studentIds)
          .gte("date", thirtyDaysAgo.toISOString().slice(0, 10))
      : { data: [] as { user_id: string }[] };

  const attendanceCountByStudent = new Map<string, number>();
  for (const row of attendanceRows ?? []) {
    attendanceCountByStudent.set(row.user_id, (attendanceCountByStudent.get(row.user_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-muted-foreground">Full student directory and attendance.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>{students?.length ?? 0} students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance (30d)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(students ?? []).map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.level_id ? levelNameById.get(student.level_id) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                    </TableCell>
                    <TableCell>{attendanceCountByStudent.get(student.id) ?? 0}</TableCell>
                    <TableCell className="text-right">
                      {student.status === "active" && <RemoveStudentDialog profileId={student.id} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
