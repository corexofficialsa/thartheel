import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ count: pendingStudents }, { count: pendingTeachers }, { count: classroomCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("status", "pending"),
    supabase.from("classrooms").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Overview</h1>
        <p className="text-muted-foreground">Recent registrations and academy activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/registrations/student">
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardDescription>Pending student registrations</CardDescription>
              <CardTitle className="text-3xl">{pendingStudents ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/registrations/teacher">
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardDescription>Pending teacher registrations</CardDescription>
              <CardTitle className="text-3xl">{pendingTeachers ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardDescription>Active classrooms</CardDescription>
            <CardTitle className="text-3xl">{classroomCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
