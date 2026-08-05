import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";

export default async function BoardVisitReportsPage() {
  const supabase = await createClient();

  const [{ data: classrooms }, { data: reports }] = await Promise.all([
    supabase.from("classrooms").select("id, name"),
    supabase
      .from("halaqa_visit_reports")
      .select("id, title, notes, classroom_id, visited_at, file_url")
      .order("visited_at", { ascending: false }),
  ]);

  const classroomNameById = new Map((classrooms ?? []).map((c) => [c.id, c.name]));
  const fileUrls = new Map<string, string | null>(
    await Promise.all(
      (reports ?? [])
        .filter((report) => report.file_url)
        .map(async (report) => [report.id, await createSignedUrl("halaqa-visit-reports", report.file_url!)] as const)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Halaqa Visit Reports</h1>
        <p className="text-muted-foreground">Inspection reports filed by admins during batch visits.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report history</CardTitle>
          <CardDescription>{reports?.length ?? 0} reports on file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!reports || reports.length === 0) && <p className="text-sm text-muted-foreground">No reports yet.</p>}
          {(reports ?? []).map((report) => (
            <div key={report.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{report.title}</p>
                <span className="text-xs text-muted-foreground">{new Date(report.visited_at).toLocaleDateString()}</span>
              </div>
              {report.classroom_id && (
                <p className="text-xs text-muted-foreground">{classroomNameById.get(report.classroom_id)}</p>
              )}
              {report.notes && <p className="mt-1 text-muted-foreground">{report.notes}</p>}
              {fileUrls.get(report.id) && (
                <a
                  href={fileUrls.get(report.id)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-primary underline underline-offset-4"
                >
                  View attachment
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
