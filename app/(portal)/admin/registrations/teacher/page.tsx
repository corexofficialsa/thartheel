import Link from "next/link";
import { RegistrationRowActions } from "@/components/admin/registration-row-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherRegistrationsPage() {
  const supabase = await createClient();
  const [{ data: pending }, { data: levels }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, username, email, phone, whatsapp_number, level_id, created_at")
      .eq("role", "teacher")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("levels").select("id, name"),
  ]);
  const levelNameById = new Map((levels ?? []).map((level) => [level.id, level.name]));

  const pendingIds = (pending ?? []).map((row) => row.id);
  const { data: cvDocs } =
    pendingIds.length > 0
      ? await supabase
          .from("admission_documents")
          .select("profile_id, file_url")
          .eq("doc_type", "cv")
          .in("profile_id", pendingIds)
      : { data: [] as { profile_id: string; file_url: string }[] };

  const signedCvByProfileId = new Map(
    await Promise.all(
      (cvDocs ?? []).map(async (doc) => [doc.profile_id, await createSignedUrl("admission-documents", doc.file_url)] as const)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teacher Registrations</h1>
        <p className="text-muted-foreground">Review and approve pending teacher sign-ups.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <CardDescription>{pending?.length ?? 0} awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          {!pending || pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending teacher registrations.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>CV</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((row) => {
                    const signedCvUrl = signedCvByProfileId.get(row.id);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.username}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{(row.level_id && levelNameById.get(row.level_id)) ?? "—"}</TableCell>
                        <TableCell>
                          {signedCvUrl ? (
                            <Link href={signedCvUrl} target="_blank" className="text-primary underline underline-offset-4">
                              View CV
                            </Link>
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
