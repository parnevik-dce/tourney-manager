"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitWaiver(formData: FormData) {
  const supabase = createAdminClient();

  const player_id = String(formData.get("player_id"));
  const tournament_id = String(formData.get("tournament_id"));
  const team_id = String(formData.get("team_id"));
  const slug = String(formData.get("slug"));
  const signer_name = String(formData.get("signer_name") ?? "");
  const signer_email = String(formData.get("signer_email") || "") || null;
  const signer_relationship =
    String(formData.get("signer_relationship") || "") || null;

  const { error } = await supabase.from("waivers").insert({
    tournament_id,
    player_id,
    signer_name,
    signer_email,
    signer_relationship,
  });

  if (error) {
    if (error.code === "23505") {
      redirect(
        `/waiver/${slug}?team=${team_id}&player=${player_id}&error=duplicate`,
      );
    }
    throw new Error(error.message);
  }

  redirect(`/waiver/${slug}?done=1`);
}
