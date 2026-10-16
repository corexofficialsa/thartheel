import type { Metadata } from "next";
import { StudentProgressTable } from "@/components/students/student-progress-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/portal/page-header";
import { matches, QueryNotice, readQuery } from "@/components/portal/query-notice";

export const metadata: Metadata = { title: "Students" };

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = readQuery((await searchParams).q);
  await requireRole("admin");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("role", "student")
    .eq("status", "active");
  const studentIds = (students ?? []).map((s) => s.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Every active student with their phase, attendance, and grades."
        actions={
          <a
            href="/admin/students/export"
            download
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="size-4" /> Export students (CSV)
          </a>
        }
      />
      {q && <QueryNotice q={q} clearHref="/admin/students" count={(students ?? []).filter((s) => matches(q, s.name, s.email)).length} />}
      <Card>
        <CardHeader>
          <CardTitle>Student progress</CardTitle>
          <CardDescription>{studentIds.length} active students</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentProgressTable studentIds={studentIds} deletable query={q} />
        </CardContent>
      </Card>
    </div>
  );
}
