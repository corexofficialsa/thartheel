import { AddLeadForm } from "@/components/admin/add-lead-form";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { MonthlyComparisonChart } from "@/components/academics/monthly-comparison-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";

function lastSixMonths(): { key: string; label: string }[] {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString(undefined, { month: "short" }) });
  }
  return months;
}

export default async function AdminGrowthPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: profiles }, { data: financeRecords }] = await Promise.all([
    supabase.from("campaign_leads").select("id, source, name, contact, status, notes, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("role, created_at").in("role", ["student", "teacher"]),
    supabase.from("finance_records").select("type, amount, date"),
  ]);

  const months = lastSixMonths();
  const registrationData = months.map(({ key, label }) => ({
    month: label,
    students: (profiles ?? []).filter((p) => p.role === "student" && p.created_at.slice(0, 7) === key).length,
    teachers: (profiles ?? []).filter((p) => p.role === "teacher" && p.created_at.slice(0, 7) === key).length,
  }));

  const revenueData = months.map(({ key, label }) => ({
    month: label,
    income: (financeRecords ?? [])
      .filter((r) => r.type === "income" && r.date.slice(0, 7) === key)
      .reduce((sum, r) => sum + r.amount, 0),
    expense: (financeRecords ?? [])
      .filter((r) => r.type === "expense" && r.date.slice(0, 7) === key)
      .reduce((sum, r) => sum + r.amount, 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Growth</h1>
        <p className="text-muted-foreground">Publicity leads and academy-wide growth analytics.</p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New lead</CardTitle>
            </CardHeader>
            <CardContent>
              <AddLeadForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leads ?? []).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>{lead.contact}</TableCell>
                    <TableCell>{lead.notes ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <LeadStatusSelect leadId={lead.id} status={lead.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(!leads || leads.length === 0) && <p className="p-4 text-sm text-muted-foreground">No leads yet.</p>}
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New registrations (last 6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyComparisonChart
                data={registrationData}
                seriesA={{ key: "students", label: "Students", color: "var(--chart-1)" }}
                seriesB={{ key: "teachers", label: "Teachers", color: "var(--chart-2)" }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revenue trend (last 6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyComparisonChart
                data={revenueData}
                seriesA={{ key: "income", label: "Income", color: "var(--chart-1)" }}
                seriesB={{ key: "expense", label: "Expense", color: "var(--chart-2)" }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
