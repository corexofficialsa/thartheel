import type { Metadata } from "next";
import { FinancialSummary } from "@/components/finance/financial-summary";
import { PrintButton } from "@/components/finance/print-button";
import { PrintHeader } from "@/components/finance/print-header";
import { PageHeader } from "@/components/portal/page-header";
import { requireRole } from "@/lib/auth/session";
import { resolvePeriod } from "@/lib/finance/period";

export const metadata: Metadata = { title: "Financial summary" };

export default async function FinanceSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string; from?: string; to?: string }>;
}) {
  await requireRole("finance");
  const period = resolvePeriod(await searchParams);
  return (
    <div className="space-y-6">
      <PrintHeader title="Financial summary" subtitle={period.label} />
      <PageHeader
        title="Financial summary"
        description={`Income, expenses and balance for ${period.label}.`}
        actions={<PrintButton />}
        className="print:hidden"
      />
      <FinancialSummary period={period} basePath="/finance/summary" />
    </div>
  );
}
