"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";

export async function createAssociation(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "");
  const contactName = String(formData.get("contact_name") || "");
  const contactEmail = String(formData.get("contact_email") || "") || null;
  const contactPhone = String(formData.get("contact_phone") || "") || null;

  const { data: association, error } = await supabase
    .from("associations")
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contactName) {
    const { error: contactError } = await supabase
      .from("association_contacts")
      .insert({
        association_id: association.id,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
      });

    if (contactError) throw new Error(contactError.message);
  }

  revalidatePath("/associations");
}

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const association_id = String(formData.get("association_id"));
  const name = String(formData.get("name") ?? "");
  const division_id = String(formData.get("division_id") || "") || null;
  const registration_status = String(
    formData.get("registration_status") || "pending",
  );
  const contactName = String(formData.get("contact_name") || "");
  const contactEmail = String(formData.get("contact_email") || "") || null;
  const contactPhone = String(formData.get("contact_phone") || "") || null;
  const contactRole = String(formData.get("contact_role") || "") || null;

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      tournament_id: tournament.id,
      association_id,
      name,
      division_id,
      registration_status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contactName) {
    const { error: contactError } = await supabase.from("team_contacts").insert({
      team_id: team.id,
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      role: contactRole,
    });

    if (contactError) throw new Error(contactError.message);
  }

  revalidatePath("/associations");
}

export async function updateTeamStatus(teamId: string, formData: FormData) {
  const supabase = await createClient();
  const status = String(formData.get("status"));

  const { error } = await supabase
    .from("teams")
    .update({ registration_status: status })
    .eq("id", teamId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}
