import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your Mirqath Quran Academy account.</CardDescription>
      </CardHeader>
      <CardContent>
        {token ? (
          <ResetPasswordForm tokenHash={token} />
        ) : (
          <p className="text-sm text-muted-foreground">
            This reset link is incomplete.{" "}
            <Link href="/forgot-password" className="text-primary underline underline-offset-4">
              Request a new one
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
