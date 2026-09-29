import { RegistrationRowActions } from "@/components/admin/registration-row-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/page-header";
import { SKILL_LABEL, timeSlotLabel } from "@/lib/registration/student-options";

export default async function StudentRegistrationsPage() {
  const supabase = await createClient();
  const [{ data: pending }, { data: levels }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, name, email, phone, whatsapp_number, level_id, age, place, gender, address, makharij_level, qaida_level, tajweed_level, preferred_time_slot, terms_accepted_at, created_at"
      )
      .eq("role", "student")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("levels").select("id, name"),
  ]);
  const levelNameById = new Map((levels ?? []).map((level) => [level.id, level.name]));

  const pendingIds = (pending ?? []).map((row) => row.id);
  const [{ data: recitations }, { data: ayahs }, { data: invoices }] = await Promise.all([
    pendingIds.length > 0
      ? supabase.from("student_recitations").select("profile_id, ayah_id, audio_url").in("profile_id", pendingIds)
      : Promise.resolve({ data: [] as { profile_id: string; ayah_id: string | null; audio_url: string }[] }),
    supabase.from("quran_ayahs").select("id, reference"),
    pendingIds.length > 0
      ? supabase.from("fee_invoices").select("student_id, status").eq("period", "registration").in("student_id", pendingIds)
      : Promise.resolve({ data: [] as { student_id: string; status: string }[] }),
  ]);
  const ayahReferenceById = new Map((ayahs ?? []).map((a) => [a.id, a.reference]));
  const paidByStudentId = new Map((invoices ?? []).map((i) => [i.student_id, i.status === "paid"]));

  const recitationByProfileId = new Map((recitations ?? []).map((r) => [r.profile_id, r]));
  const signedAudioByProfileId = new Map(
    await Promise.all(
      (recitations ?? []).map(async (r) => [r.profile_id, await createSignedUrl("registration-recitations", r.audio_url)] as const)
    )
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Student registrations" description="Review and approve pending student sign-ups." />
      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <CardDescription>{pending?.length ?? 0} awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          {!pending || pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending student registrations.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Recitation</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((row) => {
                    const recitation = recitationByProfileId.get(row.id);
                    const signedAudioUrl = signedAudioByProfileId.get(row.id);
                    const isPaid = paidByStudentId.get(row.id) ?? false;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="align-top">
                          <div className="font-medium">{row.name}</div>
                          {row.terms_accepted_at && (
                            <details className="mt-1 text-xs">
                              <summary className="cursor-pointer text-primary underline-offset-4 hover:underline">
                                View answers
                              </summary>
                              <dl className="mt-2 grid w-72 grid-cols-[auto_1fr] gap-x-3 gap-y-1 whitespace-normal">
                                <dt className="text-muted-foreground">Gender</dt>
                                <dd className="capitalize">{row.gender ?? "—"}</dd>
                                <dt className="text-muted-foreground">Address</dt>
                                <dd>{row.address ?? "—"}</dd>
                                <dt className="text-muted-foreground">WhatsApp</dt>
                                <dd>{row.whatsapp_number}</dd>
                                <dt className="text-muted-foreground">Makharij</dt>
                                <dd>{row.makharij_level ? SKILL_LABEL[row.makharij_level] : "—"}</dd>
                                <dt className="text-muted-foreground">Qaida</dt>
                                <dd>{row.qaida_level ? SKILL_LABEL[row.qaida_level] : "—"}</dd>
                                <dt className="text-muted-foreground">Tajweed</dt>
                                <dd>{row.tajweed_level ? SKILL_LABEL[row.tajweed_level] : "—"}</dd>
                                <dt className="text-muted-foreground">Time slot</dt>
                                <dd>{timeSlotLabel(row.preferred_time_slot)}</dd>
                                <dt className="text-muted-foreground">Terms</dt>
                                <dd>Accepted {new Date(row.terms_accepted_at).toLocaleDateString("en-GB")}</dd>
                              </dl>
                            </details>
                          )}
                        </TableCell>
                        <TableCell>{row.age ?? "—"}</TableCell>
                        <TableCell>{row.place ?? "—"}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{(row.level_id && levelNameById.get(row.level_id)) ?? "—"}</TableCell>
                        <TableCell>
                          {recitation && signedAudioUrl ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {(recitation.ayah_id && ayahReferenceById.get(recitation.ayah_id)) ?? ""}
                              </span>
                              <audio src={signedAudioUrl} controls className="h-8 w-48" />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isPaid ? "default" : "secondary"}>{isPaid ? "Paid" : "Awaiting payment"}</Badge>
                        </TableCell>
                        <TableCell>
                          <RegistrationRowActions
                            profileId={row.id}
                            approveDisabled={!isPaid}
                            approveDisabledReason={!isPaid ? "Awaiting payment from finance" : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
