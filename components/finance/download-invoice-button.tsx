"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadInvoiceButton({
  studentName,
  period,
  amount,
  paidAt,
  invoiceId,
}: {
  studentName: string;
  period: string;
  amount: number;
  paidAt: string | null;
  invoiceId: string;
}) {
  async function handleDownload() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Halaqa Academy", 20, 25);
    doc.setFontSize(12);
    doc.text("Payment Receipt", 20, 33);

    doc.setDrawColor(200);
    doc.line(20, 38, 190, 38);

    doc.setFontSize(11);
    const rows: [string, string][] = [
      ["Receipt ID", invoiceId],
      ["Student", studentName],
      ["Period", period === "registration" ? "Registration fee" : period],
      ["Amount", `${amount.toFixed(2)} SAR`],
      ["Status", "Paid"],
      ["Paid on", paidAt ? new Date(paidAt).toLocaleDateString() : "—"],
    ];
    let y = 50;
    for (const [label, value] of rows) {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 9;
    }

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("This is a computer-generated receipt.", 20, y + 10);

    doc.save(`receipt-${studentName.replace(/\s+/g, "-").toLowerCase()}-${period}.pdf`);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleDownload}>
      <Download className="size-3.5" />
      PDF
    </Button>
  );
}
