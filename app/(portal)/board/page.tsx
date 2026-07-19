import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function BoardHomePage() {
  await requireRole("board");
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: teacherCount }, { count: studentCount }, { data: records }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "active"),
    supabase.from("finance_records").select("type, amount").gte("date", startOfMonth.toISOString().slice(0, 10)),
  ]);

  const income = (records ?? []).filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const expense = (records ?? []).filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Board Overview</h1>
        <p className="text-muted-foreground">A brief on everything happening across the academy.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/board/teachers">
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardDescription>Active teachers</CardDescription>
              <CardTitle className="text-3xl">{teacherCount ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardDescription>Active students</CardDescription>
            <CardTitle className="text-3xl">{studentCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Link href="/board/finance">
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardDescription>Net finance this month</CardDescription>
              <CardTitle className="text-3xl">{(income - expense).toFixed(0)} SAR</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
