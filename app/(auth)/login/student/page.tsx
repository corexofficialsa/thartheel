import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

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
