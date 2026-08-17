"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";

export async function createDivision(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const name = String(formData.get("name") ?? "");
  const skill_split = formData.get("skill_split") === "on";

  const { error } = await supabase.from("divisions").insert({
    tournament_id: tournament.id,
    name,
    skill_split,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/fields");
}

export async function deleteDivision(divisionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("divisions").delete().eq("id", divisionId);
  if (error) throw new Error(error.message);
  revalidatePath("/fields");
}

export async function createField(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const name = String(formData.get("name") ?? "");
  const notes = String(formData.get("notes") || "") || null;
  const divisionIds = formData.getAll("division_ids").map(String);

  const { data: field, error } = await supabase
    .from("fields")
    .insert({ tournament_id: tournament.id, name, notes })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (divisionIds.length) {
    const { error: linkError } = await supabase.from("field_divisions").insert(
      divisionIds.map((division_id) => ({ field_id: field.id, division_id })),
    );
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/fields");
}

export async function deleteField(fieldId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fields").delete().eq("id", fieldId);
  if (error) throw new Error(error.message);
  revalidatePath("/fields");
}
