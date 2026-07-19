import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export default async function BoardFinancePage() {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthStr = startOfMonth.toISOString().slice(0, 10);

  const { data: records } = await supabase
    .from("finance_records")
    .select("id, type, category, amount, description, date")
    .gte("date", monthStr)
    .order("date", { ascending: false });

  const income = (records ?? []).filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const expense = (records ?? []).filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="text-muted-foreground">Read-only view of this month&apos;s financial records.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
        <Card>
          <CardHeader>
            <CardDescription>Net</CardDescription>
            <CardTitle className="text-3xl">{(income - expense).toFixed(0)} SAR</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
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
            {(records ?? []).map((record) => (
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
        {(!records || records.length === 0) && (
          <p className="p-4 text-sm text-muted-foreground">No financial records yet this month.</p>
        )}
      </Card>
    </div>
  );
}
