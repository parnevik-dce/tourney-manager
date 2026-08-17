"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTournament(formData: FormData) {
  const supabase = await createClient();

  const year = Number(formData.get("year"));
  const name = String(formData.get("name") ?? "");
  const start_date = String(formData.get("start_date") || "") || null;
  const end_date = String(formData.get("end_date") || "") || null;
  const location = String(formData.get("location") || "") || null;
  const public_slug = String(formData.get("public_slug") || year);

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      year,
      name,
      start_date,
      end_date,
      location,
      public_slug,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: divisionsError } = await supabase.from("divisions").insert(
    ["8U", "10U", "12U", "14U"].map((divisionName, i) => ({
      tournament_id: tournament.id,
      name: divisionName,
      sort_order: i,
    })),
  );

  if (divisionsError) {
    throw new Error(divisionsError.message);
  }

  redirect("/tournaments");
}
