import { RegistrationRowActions } from "@/components/admin/registration-row-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";

export default async function StudentRegistrationsPage() {
  const supabase = await createClient();
  const [{ data: pending }, { data: levels }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, phone, whatsapp_number, level_id, age, place, created_at")
      .eq("role", "student")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("levels").select("id, name"),
  ]);
  const levelNameById = new Map((levels ?? []).map((level) => [level.id, level.name]));

  const pendingIds = (pending ?? []).map((row) => row.id);
  const { data: recitations } =
    pendingIds.length > 0
      ? await supabase.from("student_recitations").select("profile_id, ayah_id, audio_url").in("profile_id", pendingIds)
      : { data: [] as { profile_id: string; ayah_id: string | null; audio_url: string }[] };

  const { data: ayahs } = await supabase.from("quran_ayahs").select("id, reference");
  const ayahReferenceById = new Map((ayahs ?? []).map((a) => [a.id, a.reference]));

  const recitationByProfileId = new Map((recitations ?? []).map((r) => [r.profile_id, r]));
  const signedAudioByProfileId = new Map(
    await Promise.all(
      (recitations ?? []).map(async (r) => [r.profile_id, await createSignedUrl("registration-recitations", r.audio_url)] as const)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Student Registrations</h1>
        <p className="text-muted-foreground">Review and approve pending student sign-ups.</p>
      </div>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((row) => {
                    const recitation = recitationByProfileId.get(row.id);
                    const signedAudioUrl = signedAudioByProfileId.get(row.id);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
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
                          <RegistrationRowActions profileId={row.id} />
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
