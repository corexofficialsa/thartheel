import { CreateHomeworkForm } from "@/components/teacher/create-homework-form";
import { GradeSubmissionForm } from "@/components/teacher/grade-submission-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireRole } from "@/lib/auth/session";
import { createSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherHomeworkPage() {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });
  const classroomIds = (classrooms ?? []).map((c) => c.id);
  const classroomNameById = new Map((classrooms ?? []).map((c) => [c.id, c.name]));

  const { data: homeworkList } =
    classroomIds.length > 0
      ? await supabase
          .from("homework")
          .select("id, classroom_id, title, description, due_date")
          .in("classroom_id", classroomIds)
          .order("due_date", { ascending: false })
      : { data: [] as { id: string; classroom_id: string; title: string; description: string | null; due_date: string }[] };

  const homeworkIds = (homeworkList ?? []).map((h) => h.id);
  const { data: submissions } =
    homeworkIds.length > 0
      ? await supabase
          .from("homework_submissions")
          .select("id, homework_id, student_id, text_answer, video_url, audio_url, submitted_at")
          .in("homework_id", homeworkIds)
      : { data: [] as {
          id: string;
          homework_id: string;
          student_id: string;
          text_answer: string | null;
          video_url: string | null;
          audio_url: string | null;
          submitted_at: string;
        }[] };

  const studentIds = [...new Set((submissions ?? []).map((s) => s.student_id))];
  const { data: students } =
    studentIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", studentIds)
      : { data: [] as { id: string; name: string }[] };
  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.name]));

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: grades } =
    submissionIds.length > 0
      ? await supabase.from("homework_grades").select("submission_id, grade, feedback").in("submission_id", submissionIds)
      : { data: [] as { submission_id: string; grade: number | null; feedback: string | null }[] };
  const gradeBySubmissionId = new Map((grades ?? []).map((g) => [g.submission_id, g]));

  const signedUrls = new Map<string, string | null>();
  for (const submission of submissions ?? []) {
    if (submission.video_url) {
      signedUrls.set(submission.video_url, await createSignedUrl("homework-submissions", submission.video_url));
    }
    if (submission.audio_url) {
      signedUrls.set(submission.audio_url, await createSignedUrl("homework-submissions", submission.audio_url));
    }
  }

  const submissionsByHomeworkId = new Map<string, typeof submissions>();
  for (const submission of submissions ?? []) {
    const list = submissionsByHomeworkId.get(submission.homework_id) ?? [];
    list.push(submission);
    submissionsByHomeworkId.set(submission.homework_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Homework</h1>
        <p className="text-muted-foreground">Assign homework and review student submissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post new homework</CardTitle>
          <CardDescription>Every enrolled student will get a WhatsApp notification.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateHomeworkForm classrooms={classrooms ?? []} />
        </CardContent>
      </Card>

      {(homeworkList ?? []).map((hw) => {
        const hwSubmissions = submissionsByHomeworkId.get(hw.id) ?? [];
        return (
          <Card key={hw.id}>
            <CardHeader>
              <CardTitle>{hw.title}</CardTitle>
              <CardDescription>
                {classroomNameById.get(hw.classroom_id) ?? "Classroom"} — due {new Date(hw.due_date).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hw.description && <p className="text-sm text-muted-foreground">{hw.description}</p>}
              <Separator />
              <p className="text-sm font-medium">Submissions ({hwSubmissions.length})</p>
              {hwSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {hwSubmissions.map((submission) => {
                    const grade = gradeBySubmissionId.get(submission.id);
                    return (
                      <div key={submission.id} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{studentNameById.get(submission.student_id) ?? "Student"}</p>
                        {submission.text_answer && <p className="mt-1 text-muted-foreground">{submission.text_answer}</p>}
                        <div className="mt-2 flex flex-wrap gap-3">
                          {submission.video_url && signedUrls.get(submission.video_url) && (
                            <video src={signedUrls.get(submission.video_url)!} controls className="h-32 rounded-md" />
                          )}
                          {submission.audio_url && signedUrls.get(submission.audio_url) && (
                            <audio src={signedUrls.get(submission.audio_url)!} controls />
                          )}
                        </div>
                        <div className="mt-3">
                          <GradeSubmissionForm
                            submissionId={submission.id}
                            existingGrade={grade?.grade}
                            existingFeedback={grade?.feedback}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
