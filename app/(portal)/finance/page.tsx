import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/portal/stat-card";
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
        <StatCard icon={Wallet} label="Fees due" value={feesDue ?? 0} href="/finance/ledger" />
        <StatCard icon={TrendingUp} label="Income this month" value={`${income.toFixed(0)} SAR`} />
        <StatCard icon={TrendingDown} label="Expenses this month" value={`${expense.toFixed(0)} SAR`} />
      </div>
    </div>
  );
}
