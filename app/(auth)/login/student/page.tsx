import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Student log in", description: "Student log in for Mirqath Quran Academy — classes, homework and progress." };

export default function StudentLoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student log in</CardTitle>
        <CardDescription>Use the email and password you registered with.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm role="student" />
      </CardContent>
    </Card>
  );
}
