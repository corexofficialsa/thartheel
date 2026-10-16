import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Teacher log in", description: "Teacher log in for Mirqath Quran Academy — classrooms, homework and students." };

export default function TeacherLoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher log in</CardTitle>
        <CardDescription>Use the email/username and password you registered with.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm role="teacher" />
      </CardContent>
    </Card>
  );
}
