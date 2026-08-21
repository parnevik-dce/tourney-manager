"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitWaiver(formData: FormData) {
  const supabase = createAdminClient();

  const tournament_id = String(formData.get("tournament_id"));
  const team_id = String(formData.get("team_id"));
  const association_id = String(formData.get("association_id"));
  const division_id = String(formData.get("division_id"));
  const slug = String(formData.get("slug"));
  const participant_first_name = String(
    formData.get("participant_first_name") ?? "",
  );
  const participant_last_name = String(
    formData.get("participant_last_name") ?? "",
  );
  const participant_birthdate =
    String(formData.get("participant_birthdate") || "") || null;
  const guardian_first_name =
    String(formData.get("guardian_first_name") || "") || null;
  const guardian_last_name =
    String(formData.get("guardian_last_name") || "") || null;
  const consent = formData.get("consent") === "on";

  const backParams = `association=${association_id}&division=${division_id}&team=${team_id}`;

  if (!consent) {
    redirect(`/waiver/${slug}?${backParams}&error=consent`);
  }

  const { error } = await supabase.from("waivers").insert({
    tournament_id,
    team_id,
    participant_first_name,
    participant_last_name,
    participant_birthdate,
    guardian_first_name,
    guardian_last_name,
    consent,
    // Legacy required column — the guardian is the one signing/consenting.
    signer_name: `${guardian_first_name ?? ""} ${guardian_last_name ?? ""}`.trim(),
    signer_relationship: "Guardian",
  });

  if (error) {
    if (error.code === "23505") {
      redirect(`/waiver/${slug}?${backParams}&error=duplicate`);
    }
    throw new Error(error.message);
  }

  redirect(`/waiver/${slug}?done=1`);
}
