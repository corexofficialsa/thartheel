import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERIOD_PRESETS, type Period } from "@/lib/finance/period";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const sar = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
const day = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

type Item = { id: string; category: string; description: string | null; amount: number; date: string };

// Income, expense and balance for a period, then every income and expense
// item listed underneath. Shared by the finance and board portals.
export async function FinancialSummary({ period, basePath }: { period: Period; basePath: string }) {
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("finance_records")
    .select("id, type, category, amount, description, date")
    .gte("date", period.startDate)
    .lte("date", period.endDate)
    .order("date", { ascending: true });

  const income = (records ?? []).filter((r) => r.type === "income");
  const expense = (records ?? []).filter((r) => r.type === "expense");
  const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = expense.reduce((s, r) => s + Number(r.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <form method="get" action={basePath} className="flex flex-wrap items-end gap-2 print:hidden">
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_PRESETS.map((n) => (
            <Link
              key={n}
              href={`${basePath}?months=${n}`}
              className={cn(
                "inline-flex h-9 items-center rounded-lg border px-3 text-sm transition-colors hover:bg-muted",
                period.preset === n && "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              Last {n} months
            </Link>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            From
            <input
              type="month"
              name="from"
              defaultValue={period.from}
              className="block h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            To
            <input
              type="month"
              name="to"
              defaultValue={period.to}
              className="block h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
            />
          </label>
          <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90">
            Show
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <Total label="Income" value={sar(totalIncome)} tone="success" />
        <Total label="Expense" value={sar(totalExpense)} tone="destructive" />
        <Total
          label="Balance"
          value={`${balance < 0 ? "−" : ""}${sar(Math.abs(balance))}`}
          tone={balance < 0 ? "destructive" : "default"}
          note={balance < 0 ? "Spent more than received" : undefined}
        />
      </div>

      <ItemTable title="Income" items={income} total={totalIncome} empty="No income recorded in this period." />
      <ItemTable title="Expenses" items={expense} total={totalExpense} empty="No expenses recorded in this period." />
    </div>
  );
}

function Total({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone: "success" | "destructive" | "default";
  note?: string;
}) {
  return (
    <Card className="print:shadow-none">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "font-heading text-2xl font-normal tabular-nums sm:text-3xl print:text-2xl",
            tone === "success" && "text-success",
            tone === "destructive" && "text-destructive"
          )}
        >
          {value}
        </CardTitle>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardHeader>
    </Card>
  );
}

function ItemTable({ title, items, total, empty }: { title: string; items: Item[]; total: number; empty: string }) {
  return (
    <Card className="break-inside-avoid-page print:shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {items.length} item{items.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={item.id} className="break-inside-avoid">
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{item.category}</div>
                    {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                  </TableCell>
                  <TableCell>{day(item.date)}</TableCell>
                  <TableCell className="text-right">{sar(Number(item.amount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total {title.toLowerCase()}</TableCell>
                <TableCell className="text-right">{sar(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
