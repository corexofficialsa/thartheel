"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

export async function addFinanceRecord(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const type = formData.get("type");
  const category = formData.get("category");
  const amount = formData.get("amount");
  const description = formData.get("description");
  const date = formData.get("date");

  if (type !== "income" && type !== "expense") return { error: "Select a type." };
  if (typeof category !== "string" || !category.trim()) return { error: "Enter a category." };
  const amountValue = Number(amount);
  if (!Number.isFinite(amountValue) || amountValue <= 0) return { error: "Enter a valid amount." };
  if (typeof date !== "string" || !date) return { error: "Select a date." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  const { error } = await supabase.from("finance_records").insert({
    type,
    category: category.trim(),
    amount: amountValue,
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    date,
    created_by: profile.id,
  });

  if (error) return { error: "Could not save record." };
  revalidatePath("/finance/ledger");
  revalidatePath("/board/finance");
}

export async function createFeeInvoice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const studentId = formData.get("studentId");
  const period = formData.get("period");
  const amount = formData.get("amount");

  if (typeof studentId !== "string" || !studentId) return { error: "Select a student." };
  if (typeof period !== "string" || !period.trim()) return { error: "Enter a period, e.g. 2026-07." };
  const amountValue = Number(amount) || 100;

  const supabase = await createClient();
  const { error } = await supabase.from("fee_invoices").insert({
    student_id: studentId,
    period: period.trim(),
    amount: amountValue,
  });

  if (error) return { error: "Could not create invoice — it may already exist for this period." };
  revalidatePath("/finance/ledger");
}

function revalidateFinancePaths() {
  revalidatePath("/finance/ledger");
  revalidatePath("/finance");
  revalidatePath("/board/finance");
}

// Records one payment against an invoice — the full remaining balance, or a
// partial installment. Each payment is logged as its own income record so
// finance history shows installments on the dates they were actually paid;
// the invoice only flips to "paid" once the whole amount is covered.
async function applyPayment(invoiceId: string, requestedAmount: number | null): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("fee_invoices")
    .select("student_id, period, amount, amount_paid, status")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return { error: "Invoice not found." };

  const remaining = invoice.amount - invoice.amount_paid;
  if (remaining <= 0) return { error: "This invoice is already fully paid." };
  const payment = requestedAmount ?? remaining;
  if (!Number.isFinite(payment) || payment <= 0) return { error: "Enter a valid amount." };
  if (payment > remaining) return { error: `Only ${remaining.toFixed(2)} SAR remains on this invoice.` };

  const newPaid = invoice.amount_paid + payment;
  const fullyPaid = newPaid >= invoice.amount;
  const { error } = await supabase
    .from("fee_invoices")
    .update({
      amount_paid: newPaid,
      status: fullyPaid ? "paid" : invoice.status,
      paid_at: fullyPaid ? new Date().toISOString() : null,
      method: "manual",
    })
    .eq("id", invoiceId);
  if (error) return { error: "Could not record payment." };

  const { data: student } = await supabase.from("profiles").select("name").eq("id", invoice.student_id).single();
  const isInstallment = !fullyPaid || invoice.amount_paid > 0;
  await supabase.from("finance_records").insert({
    type: "income",
    category: invoice.period === "registration" ? "Registration fee" : "Tuition fee",
    amount: payment,
    description: `${student?.name ?? "Student"} — ${invoice.period}${isInstallment ? " (installment)" : ""}`,
    date: new Date().toISOString().slice(0, 10),
    created_by: profile.id,
  });

  revalidateFinancePaths();
}

export async function markFeePaid(formData: FormData): Promise<void> {
  const invoiceId = formData.get("invoiceId");
  if (typeof invoiceId !== "string") return;
  await applyPayment(invoiceId, null);
}

export async function recordInstallment(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const invoiceId = formData.get("invoiceId");
  if (typeof invoiceId !== "string") return { error: "Invalid invoice." };
  return applyPayment(invoiceId, Number(formData.get("amount")));
}

export async function editInvoiceAmount(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const invoiceId = formData.get("invoiceId");
  const amountValue = Number(formData.get("amount"));
  if (typeof invoiceId !== "string") return { error: "Invalid invoice." };
  if (!Number.isFinite(amountValue) || amountValue <= 0) return { error: "Enter a valid amount." };

  const supabase = await createClient();
  const { data: invoice } = await supabase.from("fee_invoices").select("amount_paid").eq("id", invoiceId).single();
  if (!invoice) return { error: "Invoice not found." };
  if (amountValue < invoice.amount_paid) {
    return { error: `${invoice.amount_paid.toFixed(2)} SAR is already paid — the total can't be lower than that.` };
  }

  const fullyPaid = amountValue <= invoice.amount_paid;
  const { error } = await supabase
    .from("fee_invoices")
    .update({
      amount: amountValue,
      status: fullyPaid ? "paid" : "due",
      paid_at: fullyPaid ? new Date().toISOString() : null,
    })
    .eq("id", invoiceId);
  if (error) return { error: "Could not update invoice." };

  revalidateFinancePaths();
}

// Delete actions below are for cleaning up mistakenly-added entries — RLS
// (each table's *_write "for all" policy) already lets finance delete any
// row, not just ones they created themselves.

export async function deleteFinanceRecord(formData: FormData): Promise<void> {
  const recordId = formData.get("recordId");
  if (typeof recordId !== "string") return;
  const supabase = await createClient();
  await supabase.from("finance_records").delete().eq("id", recordId);
  revalidatePath("/finance/ledger");
  revalidatePath("/finance");
  revalidatePath("/board/finance");
}

export async function deleteFeeInvoice(formData: FormData): Promise<void> {
  const invoiceId = formData.get("invoiceId");
  if (typeof invoiceId !== "string") return;
  const supabase = await createClient();
  await supabase.from("fee_invoices").delete().eq("id", invoiceId);
  revalidatePath("/finance/ledger");
}

export async function setBudget(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const period = formData.get("period");
  const category = formData.get("category");
  const limitAmount = formData.get("limitAmount");

  if (typeof period !== "string" || !period.trim()) return { error: "Enter a period, e.g. 2026-07." };
  if (typeof category !== "string" || !category.trim()) return { error: "Enter a category." };
  const limitValue = Number(limitAmount);
  if (!Number.isFinite(limitValue) || limitValue <= 0) return { error: "Enter a valid limit." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .upsert(
      { period: period.trim(), category: category.trim(), limit_amount: limitValue, center_id: null },
      { onConflict: "center_id,period,category" }
    );

  if (error) return { error: "Could not save budget." };
  revalidatePath("/finance/ledger");
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const budgetId = formData.get("budgetId");
  if (typeof budgetId !== "string") return;
  const supabase = await createClient();
  await supabase.from("budgets").delete().eq("id", budgetId);
  revalidatePath("/finance/ledger");
}

export async function setSalaryAllocation(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const category = formData.get("category");
  const profileId = formData.get("profileId");
  const payee = formData.get("payee");
  const period = formData.get("period");
  const amountValue = Number(formData.get("amount"));

  if (category !== "staff" && category !== "tech_support" && category !== "tech_maintenance") {
    return { error: "Select a type." };
  }
  if (typeof period !== "string" || !period.trim()) return { error: "Enter a period, e.g. 2026-07." };
  if (!Number.isFinite(amountValue) || amountValue <= 0) return { error: "Enter a valid amount." };

  const supabase = await createClient();

  if (category === "staff") {
    if (typeof profileId !== "string" || !profileId) return { error: "Select a person." };
    // Role is looked up server-side rather than trusted from the form — it must
    // reflect the actual profile, not whichever option happened to be selected last.
    const { data: person } = await supabase.from("profiles").select("role").eq("id", profileId).single();
    if (!person || (person.role !== "teacher" && person.role !== "admin")) {
      return { error: "Select a teacher or admin." };
    }
    const { error } = await supabase
      .from("salary_allocations")
      .upsert(
        { profile_id: profileId, role: person.role, category, period: period.trim(), amount: amountValue },
        { onConflict: "profile_id,period" }
      );
    if (error) return { error: "Could not save allocation." };
  } else {
    if (typeof payee !== "string" || !payee.trim()) return { error: "Enter who is being paid." };
    const { error } = await supabase
      .from("salary_allocations")
      .insert({ category, payee: payee.trim(), period: period.trim(), amount: amountValue });
    if (error) return { error: "Could not save allocation." };
  }

  revalidatePath("/finance/ledger");
}

export async function deleteSalaryAllocation(formData: FormData): Promise<void> {
  const allocationId = formData.get("allocationId");
  if (typeof allocationId !== "string") return;
  const supabase = await createClient();
  await supabase.from("salary_allocations").delete().eq("id", allocationId);
  revalidatePath("/finance/ledger");
}
