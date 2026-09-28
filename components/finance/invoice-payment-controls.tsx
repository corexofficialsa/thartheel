"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editInvoiceAmount, markFeePaid, recordInstallment } from "@/app/(portal)/finance/ledger/actions";

type Mode = "installment" | "edit" | null;

export function InvoicePaymentControls({
  invoiceId,
  amount,
  amountPaid,
  isPaid,
}: {
  invoiceId: string;
  amount: number;
  amountPaid: number;
  isPaid: boolean;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const remaining = amount - amountPaid;

  function open(next: Mode) {
    setError(null);
    setValue(next === "edit" ? String(amount) : "");
    setMode(next);
  }

  function payInFull() {
    const formData = new FormData();
    formData.set("invoiceId", invoiceId);
    startTransition(async () => {
      await markFeePaid(formData);
      toast.success("Payment recorded.");
    });
  }

  function submit() {
    const formData = new FormData();
    formData.set("invoiceId", invoiceId);
    formData.set("amount", value);
    startTransition(async () => {
      const result = mode === "edit" ? await editInvoiceAmount(undefined, formData) : await recordInstallment(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success(mode === "edit" ? "Invoice updated." : "Installment recorded.");
      setMode(null);
    });
  }

  return (
    <>
      {!isPaid && (
        <>
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={payInFull}>
            {amountPaid > 0 ? `Pay rest (${remaining.toFixed(0)})` : "Mark paid"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => open("installment")}>
            Installment
          </Button>
        </>
      )}
      <Button type="button" size="icon-sm" variant="ghost" onClick={() => open("edit")} aria-label="Edit invoice amount">
        <Pencil className="size-3.5" />
      </Button>

      <Dialog open={mode !== null} onOpenChange={(next) => !next && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit invoice total" : "Record an installment"}</DialogTitle>
            <DialogDescription>
              {amountPaid.toFixed(2)} SAR paid of {amount.toFixed(2)} SAR
              {!isPaid && ` · ${remaining.toFixed(2)} SAR remaining`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`invoice-amount-${invoiceId}`}>{mode === "edit" ? "New total (SAR)" : "Amount paid now (SAR)"}</Label>
            <Input
              id={`invoice-amount-${invoiceId}`}
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={isPending || !value} onClick={submit}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
