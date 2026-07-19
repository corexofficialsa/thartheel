import { FileText } from "lucide-react";
import { MilestoneHistogram } from "@/components/academics/milestone-histogram";
import { CreateExamForm } from "@/components/teacher/create-exam-form";
import { ProgressReportForm } from "@/components/teacher/progress-report-form";
import { PublishResultForm } from "@/components/teacher/publish-result-form";
import { RecordMilestoneForm } from "@/components/teacher/record-milestone-form";
import { UploadTeachingNoteForm } from "@/components/teacher/upload-teaching-note-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth/session";
import { createSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherAcademicsPage() {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data: classrooms } = await supabase.from("classrooms").select("id, name").eq("teacher_id", profile.id);
  const classroomIds = (classrooms ?? []).map((c) => c.id);

  const { data: enrollments } =
    classroomIds.length > 0
      ? await supabase.from("classroom_students").select("student_id").in("classroom_id", classroomIds)
      : { data: [] as { student_id: string }[] };
  const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];

  const [{ data: students }, { data: tracks }, { data: levels }] = await Promise.all([
    studentIds.length > 0
      ? supabase.from("profiles").select("id, name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("syllabus_tracks").select("id, name, total_milestones"),
    supabase.from("levels").select("id, name"),
  ]);
  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.name]));

  const { data: milestones } =
    studentIds.length > 0
      ? await supabase.from("student_milestones").select("student_id, track_id, milestone_index").in("student_id", studentIds)
      : { data: [] as { student_id: string; track_id: string; milestone_index: number }[] };

  const currentMilestoneByStudentTrack = new Map<string, number>();
  for (const m of milestones ?? []) {
    const key = `${m.student_id}:${m.track_id}`;
    const current = currentMilestoneByStudentTrack.get(key) ?? 0;
    if (m.milestone_index > current) currentMilestoneByStudentTrack.set(key, m.milestone_index);
  }

  const { data: progressReports } =
    studentIds.length > 0
      ? await supabase
          .from("progress_reports")
          .select("id, student_id, period, notes, created_at")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] as { id: string; student_id: string; period: string; notes: string; created_at: string }[] };

  const { data: exams } =
    classroomIds.length > 0
      ? await supabase
          .from("exams")
          .select("id, classroom_id, title, exam_type, scheduled_at")
          .in("classroom_id", classroomIds)
          .order("scheduled_at", { ascending: false })
      : { data: [] as { id: string; classroom_id: string; title: string; exam_type: string; scheduled_at: string }[] };
  const classroomNameById = new Map((classrooms ?? []).map((c) => [c.id, c.name]));

  const examIds = (exams ?? []).map((e) => e.id);
  const { data: results } =
    examIds.length > 0
      ? await supabase.from("exam_results").select("exam_id, student_id, marks").in("exam_id", examIds)
      : { data: [] as { exam_id: string; student_id: string; marks: number }[] };
  const resultByExamStudent = new Map(results?.map((r) => [`${r.exam_id}:${r.student_id}`, r.marks]) ?? []);

  const enrolledByClassroom = new Map<string, string[]>();
  const { data: allEnrollments } =
    classroomIds.length > 0
      ? await supabase.from("classroom_students").select("classroom_id, student_id").in("classroom_id", classroomIds)
      : { data: [] as { classroom_id: string; student_id: string }[] };
  for (const row of allEnrollments ?? []) {
    const list = enrolledByClassroom.get(row.classroom_id) ?? [];
    list.push(row.student_id);
    enrolledByClassroom.set(row.classroom_id, list);
  }

  const { data: notes } = await supabase
    .from("teaching_notes")
    .select("id, title, file_url, level_id, created_at")
    .order("created_at", { ascending: false });
  const levelNameById = new Map((levels ?? []).map((l) => [l.id, l.name]));
  const noteUrls = new Map<string, string | null>();
  for (const note of notes ?? []) {
    noteUrls.set(note.id, await createSignedUrl("teaching-notes", note.file_url));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Academics</h1>
        <p className="text-muted-foreground">Milestones, progress reports, exams, and teaching notes.</p>
      </div>

      <Tabs defaultValue="milestones">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="reports">Progress Reports</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="notes">Teaching Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record a milestone</CardTitle>
              <CardDescription>Qaida Noorania lessons, Tajweed &amp; Qira&apos;at progress.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecordMilestoneForm students={students ?? []} tracks={tracks ?? []} />
            </CardContent>
          </Card>

          {(tracks ?? []).map((track) => {
            const histogramData = Array.from({ length: track.total_milestones }, (_, i) => i + 1).map((index) => ({
              milestone: index,
              count: studentIds.filter((sid) => currentMilestoneByStudentTrack.get(`${sid}:${track.id}`) === index).length,
            }));
            return (
              <Card key={track.id}>
                <CardHeader>
                  <CardTitle>{track.name}</CardTitle>
                  <CardDescription>Current milestone reached, across students</CardDescription>
                </CardHeader>
                <CardContent>
                  <MilestoneHistogram data={histogramData} />
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New progress report</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressReportForm students={students ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(progressReports ?? []).length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
              {(progressReports ?? []).map((report) => (
                <div key={report.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">
                    {studentNameById.get(report.student_id) ?? "Student"}{" "}
                    <span className="font-normal text-muted-foreground">
                      — {report.period} — {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="mt-1 text-muted-foreground">{report.notes}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule an exam</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateExamForm classrooms={classrooms ?? []} />
            </CardContent>
          </Card>

          {(exams ?? []).map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
                <CardDescription>
                  {classroomNameById.get(exam.classroom_id) ?? "Classroom"} — {exam.exam_type} —{" "}
                  {new Date(exam.scheduled_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Separator className="mb-3" />
                <p className="mb-2 text-sm font-medium">Marks</p>
                <div className="space-y-2">
                  {(enrolledByClassroom.get(exam.classroom_id) ?? []).map((studentId) => (
                    <PublishResultForm
                      key={studentId}
                      examId={exam.id}
                      studentId={studentId}
                      studentName={studentNameById.get(studentId) ?? "Student"}
                      existingMarks={resultByExamStudent.get(`${exam.id}:${studentId}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload a teaching note</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadTeachingNoteForm levels={levels ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(notes ?? []).length === 0 && <p className="text-sm text-muted-foreground">No notes uploaded yet.</p>}
              {(notes ?? []).map((note) => {
                const url = noteUrls.get(note.id);
                return (
                  <div key={note.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span>{note.title}</span>
                      {note.level_id && (
                        <span className="text-xs text-muted-foreground">({levelNameById.get(note.level_id)})</span>
                      )}
                    </div>
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                        Download
                      </a>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
