import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRegistrationForm } from "@/components/registration/student-registration-form";
import { pickRandomAyah } from "@/lib/quran/random-ayah";
import { createClient } from "@/lib/supabase/server";
import { registerStudent } from "./actions";

export default async function StudentRegisterPage() {
  const supabase = await createClient();
  const [{ data: levels }, { data: ayah }] = await Promise.all([
    supabase.from("levels").select("id, name, requires_recitation").order("name"),
    supabase.from("quran_ayahs").select("id, reference, arabic_text, translation").order("id"),
  ]);

  const randomAyah = pickRandomAyah(ayah ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student registration</CardTitle>
        <CardDescription>Tell us about yourself and the level you&apos;re looking to join.</CardDescription>
      </CardHeader>
      <CardContent>
        <StudentRegistrationForm
          action={registerStudent}
          levels={levels ?? []}
          ayah={
            randomAyah
              ? {
                  id: randomAyah.id,
                  reference: randomAyah.reference,
                  arabicText: randomAyah.arabic_text,
                  translation: randomAyah.translation,
                }
              : { id: "", reference: "", arabicText: "", translation: "" }
          }
        />
      </CardContent>
    </Card>
  );
}
