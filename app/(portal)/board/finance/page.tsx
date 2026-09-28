import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const HISTORY_MONTHS = 12;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default async function BoardFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { month } = await searchParams;
  const now = new Date();
  const currentMonth = monthKey(now);
  const selectedMonth = typeof month === "string" && /^\d{4}-\d{2}$/.test(month) ? month : currentMonth;

  const historyStart = new Date(now.getFullYear(), now.getMonth() - (HISTORY_MONTHS - 1), 1);
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("finance_records")
    .select("id, type, category, amount, description, date")
    .gte("date", monthKey(historyStart) + "-01")
    .order("date", { ascending: false });

  const months: string[] = [];
  for (let i = 0; i < HISTORY_MONTHS; i++) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const totals = new Map(months.map((m) => [m, { income: 0, expense: 0 }]));
  for (const r of records ?? []) {
    const t = totals.get(r.date.slice(0, 7));
    if (!t) continue;
    if (r.type === "income") t.income += r.amount;
    else t.expense += r.amount;
  }

  const selectedRecords = (records ?? []).filter((r) => r.date.startsWith(selectedMonth));
  const selected = totals.get(selectedMonth) ?? { income: 0, expense: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="text-muted-foreground">Monthly finance history for the last {HISTORY_MONTHS} months.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Income — {monthLabel(selectedMonth)}</CardDescription>
            <CardTitle className="text-3xl">{selected.income.toFixed(0)} SAR</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Expenses — {monthLabel(selectedMonth)}</CardDescription>
            <CardTitle className="text-3xl">{selected.expense.toFixed(0)} SAR</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Net — {monthLabel(selectedMonth)}</CardDescription>
            <CardTitle className="text-3xl">{(selected.income - selected.expense).toFixed(0)} SAR</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Select a month to see its records.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((m) => {
                const t = totals.get(m)!;
                const net = t.income - t.expense;
                return (
                  <TableRow key={m} className={cn(m === selectedMonth && "bg-muted/60")}>
                    <TableCell>
                      <Link href={`/board/finance?month=${m}`} prefetch={false} className="font-medium hover:underline">
                        {monthLabel(m)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{t.income.toFixed(2)} SAR</TableCell>
                    <TableCell className="text-right">{t.expense.toFixed(2)} SAR</TableCell>
                    <TableCell className={cn("text-right font-medium", net < 0 && "text-destructive")}>
                      {net.toFixed(2)} SAR
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records — {monthLabel(selectedMonth)}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{record.type}</TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>{record.description ?? "—"}</TableCell>
                  <TableCell className="text-right">{record.amount.toFixed(2)} SAR</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {selectedRecords.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No financial records for this month.</p>
        )}
      </Card>
    </div>
  );
}
