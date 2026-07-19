import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

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
