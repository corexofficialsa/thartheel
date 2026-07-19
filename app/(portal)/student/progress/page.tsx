import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function StudentProgressPage() {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const [{ data: tracks }, { data: milestones }, { data: reports }] = await Promise.all([
    supabase.from("syllabus_tracks").select("id, name, total_milestones"),
    supabase.from("student_milestones").select("track_id, milestone_index").eq("student_id", profile.id),
    supabase
      .from("progress_reports")
      .select("id, period, notes, created_at")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const currentByTrack = new Map<string, number>();
  for (const m of milestones ?? []) {
    const current = currentByTrack.get(m.track_id) ?? 0;
    if (m.milestone_index > current) currentByTrack.set(m.track_id, m.milestone_index);
  }

  const { data: results } = await supabase
    .from("exam_results")
    .select("exam_id, marks, published_at")
    .eq("student_id", profile.id)
    .not("published_at", "is", null);
  const examIds = (results ?? []).map((r) => r.exam_id);
  const { data: exams } =
    examIds.length > 0
      ? await supabase.from("exams").select("id, title, exam_type, scheduled_at").in("id", examIds)
      : { data: [] as { id: string; title: string; exam_type: string; scheduled_at: string }[] };
  const examById = new Map((exams ?? []).map((e) => [e.id, e]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="text-muted-foreground">Your milestones, teacher notes, and exam results.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(tracks ?? []).map((track) => {
          const current = currentByTrack.get(track.id) ?? 0;
          return (
            <Card key={track.id}>
              <CardHeader>
                <CardTitle>{track.name}</CardTitle>
                <CardDescription>
                  Milestone {current} of {track.total_milestones}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(current / track.total_milestones) * 100} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!reports || reports.length === 0) && <p className="text-sm text-muted-foreground">No notes yet.</p>}
          {(reports ?? []).map((report) => (
            <div key={report.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium capitalize">
                {report.period} — <span className="font-normal text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span>
              </p>
              <p className="mt-1 text-muted-foreground">{report.notes}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exam results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!results || results.length === 0) && <p className="text-sm text-muted-foreground">No results published yet.</p>}
          {(results ?? []).map((result) => {
            const exam = examById.get(result.exam_id);
            return (
              <div key={result.exam_id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{exam?.title ?? "Exam"}</span>
                <Badge variant="secondary">{result.marks} marks</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
