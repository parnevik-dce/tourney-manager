"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";

function parseAmount(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

export async function createBudgetItem(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const category = String(formData.get("category") ?? "");
  const line_item = String(formData.get("line_item") || "") || null;
  const payee = String(formData.get("payee") || "") || null;
  const forecasted_amount = parseAmount(formData.get("forecasted_amount")) ?? 0;
  const actual_amount = parseAmount(formData.get("actual_amount"));
  const due_date = String(formData.get("due_date") || "") || null;

  const { error } = await supabase.from("budget_items").insert({
    tournament_id: tournament.id,
    category,
    line_item,
    payee,
    forecasted_amount,
    actual_amount,
    due_date,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
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
}
