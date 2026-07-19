"use server";

import { revalidatePath } from "next/cache";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("finance_records").insert({
    type,
    category: category.trim(),
    amount: amountValue,
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    date,
    created_by: user.id,
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

export async function markFeePaid(formData: FormData): Promise<void> {
  const invoiceId = formData.get("invoiceId");
  if (typeof invoiceId !== "string") return;

  const supabase = await createClient();
  await supabase
    .from("fee_invoices")
    .update({ status: "paid", paid_at: new Date().toISOString(), method: "manual" })
    .eq("id", invoiceId);

  revalidatePath("/finance/ledger");
}

export async function collectDeposit(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const studentId = formData.get("studentId");
  const amount = formData.get("amount");

  if (typeof studentId !== "string" || !studentId) return { error: "Select a student." };
  const amountValue = Number(amount);
  if (!Number.isFinite(amountValue) || amountValue <= 0) return { error: "Enter a valid amount." };

  const supabase = await createClient();
  const { error } = await supabase.from("caution_deposits").insert({ student_id: studentId, amount: amountValue });
  if (error) return { error: "Could not record deposit." };
  revalidatePath("/finance/ledger");
}

export async function refundDeposit(formData: FormData): Promise<void> {
  const depositId = formData.get("depositId");
  if (typeof depositId !== "string") return;

  const supabase = await createClient();
  await supabase.from("caution_deposits").update({ status: "refunded", refunded_at: new Date().toISOString() }).eq("id", depositId);
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

export async function setSalaryAllocation(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = formData.get("profileId");
  const period = formData.get("period");
  const amount = formData.get("amount");

  if (typeof profileId !== "string" || !profileId) return { error: "Select a person." };
  if (typeof period !== "string" || !period.trim()) return { error: "Enter a period, e.g. 2026-07." };
  const amountValue = Number(amount);
  if (!Number.isFinite(amountValue) || amountValue <= 0) return { error: "Enter a valid amount." };

  const supabase = await createClient();

  // Role is looked up server-side rather than trusted from the form — it must
  // reflect the actual profile, not whichever option happened to be selected last.
  const { data: person } = await supabase.from("profiles").select("role").eq("id", profileId).single();
  if (!person || (person.role !== "teacher" && person.role !== "admin")) {
    return { error: "Select a teacher or admin." };
  }

  const { error } = await supabase
    .from("salary_allocations")
    .upsert(
      { profile_id: profileId, role: person.role, period: period.trim(), amount: amountValue },
      { onConflict: "profile_id,period" }
    );

  if (error) return { error: "Could not save allocation." };

  revalidatePath("/finance/ledger");
}
