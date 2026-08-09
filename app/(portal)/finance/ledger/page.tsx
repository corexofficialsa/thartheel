import { AddRecordForm } from "@/components/finance/add-record-form";
import { CollectDepositForm } from "@/components/finance/collect-deposit-form";
import { CreateInvoiceForm } from "@/components/finance/create-invoice-form";
import { SetBudgetForm } from "@/components/finance/set-budget-form";
import { SetSalaryForm } from "@/components/finance/set-salary-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { markFeePaid, refundDeposit } from "./actions";

export default async function FinanceLedgerPage() {
  const supabase = await createClient();

  const [{ data: records }, { data: activeStudents }, { data: allStudents }, { data: staff }] = await Promise.all([
    supabase.from("finance_records").select("id, type, category, amount, description, date").order("date", { ascending: false }).limit(30),
    supabase.from("profiles").select("id, name").eq("role", "student").eq("status", "active"),
    // Registration-fee invoices belong to still-pending students, so the
    // invoice table's name lookup needs to cover them too, not just active ones.
    supabase.from("profiles").select("id, name").eq("role", "student"),
    supabase.from("profiles").select("id, name, role").in("role", ["teacher", "admin"]).eq("status", "active"),
  ]);
  const students = activeStudents;

  const studentNameById = new Map((allStudents ?? []).map((s) => [s.id, s.name]));

  const [{ data: invoices }, { data: deposits }, { data: budgets }, { data: allocations }] = await Promise.all([
    supabase.from("fee_invoices").select("id, student_id, period, amount, status").order("period", { ascending: false }),
    supabase.from("caution_deposits").select("id, student_id, amount, status, collected_at").order("collected_at", { ascending: false }),
    supabase.from("budgets").select("id, period, category, limit_amount"),
    supabase.from("salary_allocations").select("id, profile_id, role, amount, period").order("period", { ascending: false }),
  ]);

  const admissionInvoices = (invoices ?? []).filter((invoice) => invoice.period === "registration");

  const spentByPeriodCategory = new Map<string, number>();
  for (const record of records ?? []) {
    if (record.type !== "expense") continue;
    const period = record.date.slice(0, 7);
    const key = `${period}:${record.category}`;
    spentByPeriodCategory.set(key, (spentByPeriodCategory.get(key) ?? 0) + record.amount);
  }

  const staffNameById = new Map((staff ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="text-muted-foreground">Ledger, fees, deposits, budgets, and salary allocations.</p>
      </div>

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="admission">Admission</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="salaries">Salaries</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add expense / income</CardTitle>
            </CardHeader>
            <CardContent>
              <AddRecordForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent records</CardTitle>
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
          </Card>
        </TabsContent>

        <TabsContent value="admission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admission fees</CardTitle>
            </CardHeader>
            <p className="px-6 pb-4 text-sm text-muted-foreground">
              New student registrations awaiting admission fee payment. Admin can&apos;t approve a registration until
              it&apos;s marked paid here.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissionInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No admission fees pending.
                    </TableCell>
                  </TableRow>
                )}
                {admissionInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{studentNameById.get(invoice.student_id) ?? "Student"}</TableCell>
                    <TableCell>{invoice.amount.toFixed(2)} SAR</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.status !== "paid" && (
                        <form action={markFeePaid}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Mark paid
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create fee invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateInvoiceForm students={students ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoices ?? []).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{studentNameById.get(invoice.student_id) ?? "Student"}</TableCell>
                    <TableCell>{invoice.period}</TableCell>
                    <TableCell>{invoice.amount.toFixed(2)} SAR</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.status !== "paid" && (
                        <form action={markFeePaid}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Mark paid
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collect caution deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <CollectDepositForm students={students ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Deposits</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deposits ?? []).map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>{studentNameById.get(deposit.student_id) ?? "Student"}</TableCell>
                    <TableCell>{deposit.amount.toFixed(2)} SAR</TableCell>
                    <TableCell>
                      <Badge variant={deposit.status === "held" ? "secondary" : "default"}>{deposit.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {deposit.status === "held" && (
                        <form action={refundDeposit}>
                          <input type="hidden" name="depositId" value={deposit.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Refund
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Set a budget</CardTitle>
            </CardHeader>
            <CardContent>
              <SetBudgetForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Budgets</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(budgets ?? []).map((budget) => {
                  const spent = spentByPeriodCategory.get(`${budget.period}:${budget.category}`) ?? 0;
                  const overBudget = spent > budget.limit_amount;
                  return (
                    <TableRow key={budget.id}>
                      <TableCell>{budget.period}</TableCell>
                      <TableCell>{budget.category}</TableCell>
                      <TableCell>{budget.limit_amount.toFixed(2)} SAR</TableCell>
                      <TableCell>{spent.toFixed(2)} SAR</TableCell>
                      <TableCell>
                        <Badge variant={overBudget ? "destructive" : "default"}>
                          {overBudget ? "Over budget" : "On track"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="salaries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Set salary allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <SetSalaryForm people={(staff ?? []) as { id: string; name: string; role: "teacher" | "admin" }[]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Allocations</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(allocations ?? []).map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>{staffNameById.get(allocation.profile_id) ?? "—"}</TableCell>
                    <TableCell className="capitalize">{allocation.role}</TableCell>
                    <TableCell>{allocation.period}</TableCell>
                    <TableCell className="text-right">{allocation.amount.toFixed(2)} SAR</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
