import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function FinanceHomePage() {
  await requireRole("finance");
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: feesDue }, { data: records }] = await Promise.all([
    supabase.from("fee_invoices").select("id", { count: "exact", head: true }).eq("status", "due"),
    supabase.from("finance_records").select("type, amount").gte("date", startOfMonth.toISOString().slice(0, 10)),
  ]);

  const income = (records ?? []).filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const expense = (records ?? []).filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance Overview</h1>
        <p className="text-muted-foreground">Income, expenses, and fee collection at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/finance/ledger">
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardDescription>Fees due</CardDescription>
              <CardTitle className="text-3xl">{feesDue ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardDescription>Income this month</CardDescription>
            <CardTitle className="text-3xl">{income.toFixed(0)} SAR</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Expenses this month</CardDescription>
            <CardTitle className="text-3xl">{expense.toFixed(0)} SAR</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
