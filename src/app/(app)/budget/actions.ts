"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTournament } from "@/lib/tournament";

function parseAmount(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? Math.abs(num) : null;
}

export async function createBudgetItem(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const category = String(formData.get("category") ?? "");
  const line_item = String(formData.get("line_item") || "") || null;
  const payee = String(formData.get("payee") || "") || null;
  const paid_by = String(formData.get("paid_by") || "") || null;
  const forecasted_amount = parseAmount(formData.get("forecasted_amount")) ?? 0;
  const actual_amount = parseAmount(formData.get("actual_amount"));
  const due_date = String(formData.get("due_date") || "") || null;
  const notes = String(formData.get("notes") || "") || null;
  const is_revenue = formData.get("is_revenue") === "on";

  const { error } = await supabase.from("budget_items").insert({
    tournament_id: tournament.id,
    category,
    line_item,
    payee,
    paid_by,
    forecasted_amount,
    actual_amount,
    due_date,
    notes,
    is_revenue,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/pnl");
}

export async function updateBudgetItem(itemId: string, formData: FormData) {
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "");
  const line_item = String(formData.get("line_item") || "") || null;
  const payee = String(formData.get("payee") || "") || null;
  const paid_by = String(formData.get("paid_by") || "") || null;
  const forecasted_amount = parseAmount(formData.get("forecasted_amount")) ?? 0;
  const actual_amount = parseAmount(formData.get("actual_amount"));
  const due_date = String(formData.get("due_date") || "") || null;
  const notes = String(formData.get("notes") || "") || null;
  const is_revenue = formData.get("is_revenue") === "on";
  const removeReceipt = formData.get("remove_receipt") === "on";

  const update: Record<string, unknown> = {
    category,
    line_item,
    payee,
    paid_by,
    forecasted_amount,
    actual_amount,
    due_date,
    notes,
    is_revenue,
  };

  const receiptFile = formData.get("receipt_file");
  const admin = createAdminClient();

  if (receiptFile instanceof File && receiptFile.size > 0) {
    const path = `${itemId}/${Date.now()}-${receiptFile.name}`;
    const { error: uploadError } = await admin.storage
      .from("receipts")
      .upload(path, receiptFile, { contentType: receiptFile.type });
    if (uploadError) throw new Error(uploadError.message);
    update.receipt_path = path;
  } else if (removeReceipt) {
    const { data: existing } = await supabase
      .from("budget_items")
      .select("receipt_path")
      .eq("id", itemId)
      .single();
    if (existing?.receipt_path) {
      await admin.storage.from("receipts").remove([existing.receipt_path]);
    }
    update.receipt_path = null;
  }

  const { error } = await supabase
    .from("budget_items")
    .update(update)
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/pnl");
}

export async function deleteBudgetItem(itemId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("budget_items")
    .select("receipt_path")
    .eq("id", itemId)
    .single();

  if (existing?.receipt_path) {
    const admin = createAdminClient();
    await admin.storage.from("receipts").remove([existing.receipt_path]);
  }

  const { error } = await supabase
    .from("budget_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/pnl");
}

export async function updateBudgetItemActual(
  itemId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const actual_amount = parseAmount(formData.get("actual_amount"));

  const { error } = await supabase
    .from("budget_items")
    .update({ actual_amount })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/pnl");
}

export async function createBudgetCategory(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const { data: existing } = await supabase
    .from("budget_categories")
    .select("sort_order")
    .eq("tournament_id", tournament.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("budget_categories").insert({
    tournament_id: tournament.id,
    name,
    sort_order,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/pnl");
}

export async function updateBudgetCategory(
  categoryId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const { error } = await supabase
    .from("budget_categories")
    .update({ name })
    .eq("id", categoryId);

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/pnl");
}

export async function deleteBudgetCategory(categoryId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("budget_categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/pnl");
}
