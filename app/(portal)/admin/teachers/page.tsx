import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/page-header";
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button";
import { deleteTeacher } from "./actions";

export default async function AdminTeachersPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: teachers }, { data: levels }, { data: classrooms }, { data: enrollments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, phone, level_id")
      .eq("role", "teacher")
      .eq("status", "active")
      .order("name"),
    supabase.from("levels").select("id, name"),
    supabase.from("classrooms").select("id, name, teacher_id"),
    supabase.from("classroom_students").select("classroom_id"),
  ]);

  const levelNameById = new Map((levels ?? []).map((l) => [l.id, l.name]));
  const studentCountByClassroom = new Map<string, number>();
  for (const e of enrollments ?? []) {
    studentCountByClassroom.set(e.classroom_id, (studentCountByClassroom.get(e.classroom_id) ?? 0) + 1);
  }
  const classroomsByTeacher = new Map<string, { name: string; students: number }[]>();
  for (const c of classrooms ?? []) {
    const list = classroomsByTeacher.get(c.teacher_id) ?? [];
    list.push({ name: c.name, students: studentCountByClassroom.get(c.id) ?? 0 });
    classroomsByTeacher.set(c.teacher_id, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" description="Every active teacher and the classrooms they lead." />
      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>{teachers?.length ?? 0} active teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Classrooms</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teachers ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No active teachers yet.
                    </TableCell>
                  </TableRow>
                )}
                {(teachers ?? []).map((teacher) => {
                  const taught = classroomsByTeacher.get(teacher.id) ?? [];
                  return (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="font-medium">{teacher.name}</div>
                        <div className="text-xs text-muted-foreground">{teacher.email}</div>
                      </TableCell>
                      <TableCell>{teacher.phone ?? "—"}</TableCell>
                      <TableCell>{teacher.level_id ? levelNameById.get(teacher.level_id) : "—"}</TableCell>
                      <TableCell>{taught.length > 0 ? taught.map((c) => c.name).join(", ") : "—"}</TableCell>
                      <TableCell className="text-right">{taught.reduce((sum, c) => sum + c.students, 0)}</TableCell>
                      <TableCell className="text-right">
                        <ConfirmDeleteButton
                          action={deleteTeacher.bind(null, teacher.id)}
                          title={`Delete ${teacher.name}?`}
                          description={
                            taught.length > 0
                              ? `${teacher.name} still leads ${taught.map((c) => c.name).join(", ")}. Assign a new teacher to those classrooms first, then delete.`
                              : "This permanently deletes their account and messages. Homework they posted moves to each classroom's current teacher, and progress reports they wrote are kept. It can't be undone."
                          }
                          confirmLabel="Delete teacher"
                          successMessage={`${teacher.name} was deleted.`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
