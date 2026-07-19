import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherRegistrationForm } from "@/components/registration/teacher-registration-form";
import { createClient } from "@/lib/supabase/server";
import { registerTeacher } from "./actions";

export default async function TeacherRegisterPage() {
  const supabase = await createClient();
  const { data: levels } = await supabase.from("levels").select("id, name").order("name");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher registration</CardTitle>
        <CardDescription>Tell us about yourself and the level you teach.</CardDescription>
      </CardHeader>
      <CardContent>
        <TeacherRegistrationForm action={registerTeacher} levels={levels ?? []} />
      </CardContent>
    </Card>
  );
}
