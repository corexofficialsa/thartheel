import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function StaffLoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff log in</CardTitle>
        <CardDescription>For admin, board, and finance accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm role="staff" />
      </CardContent>
    </Card>
  );
}
