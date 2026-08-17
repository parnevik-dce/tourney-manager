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

  const { error } = await supabase.from("tournaments").insert({
    year,
    name,
    start_date,
    end_date,
    location,
    public_slug,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/tournaments");
}
