import Link from "next/link";
import { RemoveTeacherDialog } from "@/components/board/remove-teacher-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export default async function BoardTeachersPage() {
  const supabase = await createClient();

  const [{ data: teachers }, { data: levels }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, phone, level_id, status").eq("role", "teacher").order("name"),
    supabase.from("levels").select("id, name"),
  ]);
  const levelNameById = new Map((levels ?? []).map((l) => [l.id, l.name]));

  const teacherIds = (teachers ?? []).map((t) => t.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: attendanceRows } =
    teacherIds.length > 0
      ? await supabase
          .from("attendance")
          .select("user_id")
          .in("user_id", teacherIds)
          .gte("date", thirtyDaysAgo.toISOString().slice(0, 10))
      : { data: [] as { user_id: string }[] };

  const attendanceCountByTeacher = new Map<string, number>();
  for (const row of attendanceRows ?? []) {
    attendanceCountByTeacher.set(row.user_id, (attendanceCountByTeacher.get(row.user_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teachers</h1>
        <p className="text-muted-foreground">Full teacher directory and attendance.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>{teachers?.length ?? 0} teachers</CardDescription>
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
                {(teachers ?? []).map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      <Link href={`/board/teachers/${teacher.id}`} className="hover:underline">
                        {teacher.name}
                      </Link>
                    </TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.level_id ? levelNameById.get(teacher.level_id) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === "active" ? "default" : "secondary"}>{teacher.status}</Badge>
                    </TableCell>
                    <TableCell>{attendanceCountByTeacher.get(teacher.id) ?? 0}</TableCell>
                    <TableCell className="text-right">
                      {teacher.status === "active" && <RemoveTeacherDialog profileId={teacher.id} />}
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
