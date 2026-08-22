"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTournament } from "@/lib/tournament";
import { getCurrentProfile } from "@/lib/profile";

export async function createAssociation(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "");
  const mascot = String(formData.get("mascot") || "") || null;
  const contactName = String(formData.get("contact_name") || "");
  const contactRole = String(formData.get("contact_role") || "") || null;
  const contactEmail = String(formData.get("contact_email") || "") || null;
  const contactPhone = String(formData.get("contact_phone") || "") || null;

  const { data: association, error } = await supabase
    .from("associations")
    .insert({ name, mascot })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contactName) {
    const { error: contactError } = await supabase
      .from("association_contacts")
      .insert({
        association_id: association.id,
        name: contactName,
        role: contactRole,
        email: contactEmail,
        phone: contactPhone,
      });

    if (contactError) throw new Error(contactError.message);
  }

  revalidatePath("/associations");
}

export async function updateAssociation(
  associationId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const mascot = String(formData.get("mascot") || "") || null;

  const { error } = await supabase
    .from("associations")
    .update({ name, mascot })
    .eq("id", associationId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/list");
}

export async function updateAssociationContact(
  contactId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;

  const { error } = await supabase
    .from("association_contacts")
    .update({ name, role, phone, email })
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function addAssociationContact(
  associationId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;
  if (!name.trim()) return;

  const { error } = await supabase.from("association_contacts").insert({
    association_id: associationId,
    name,
    role,
    phone,
    email,
  });

  if (error) throw new Error(error.message);

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

export async function updateTeam(teamId: string, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "");
  const division_id = String(formData.get("division_id") || "") || null;
  const registration_status = String(
    formData.get("registration_status") || "pending",
  );

  const { error } = await supabase
    .from("teams")
    .update({ name, division_id, registration_status })
    .eq("id", teamId);

  if (error) throw new Error(error.message);

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

export async function updateTeamContact(
  contactId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;

  const { error } = await supabase
    .from("team_contacts")
    .update({ name, role, phone, email })
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function addTeamContact(teamId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;
  if (!name.trim()) return;

  const { error } = await supabase.from("team_contacts").insert({
    team_id: teamId,
    name,
    role,
    phone,
    email,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function uploadRoster(teamId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const file = formData.get("roster_file");
  if (!(file instanceof File) || file.size === 0) return;

  const admin = createAdminClient();
  const path = `${teamId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await admin.storage
    .from("rosters")
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({ roster_file_url: path, roster_uploaded_at: new Date().toISOString() })
    .eq("id", teamId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function deleteAssociationContact(contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("association_contacts")
    .delete()
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function deleteTeamContact(contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_contacts")
    .delete()
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function deleteAssociation(associationId: string) {
  const supabase = await createClient();

  const { count: teamCount } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("association_id", associationId);

  if (teamCount && teamCount > 0) {
    redirect(
      `/associations?error=${encodeURIComponent(
        `Can't delete this association — it has ${teamCount} team${teamCount === 1 ? "" : "s"} on record (across all tournament years). Delete those teams first.`,
      )}`,
    );
  }

  const { error } = await supabase
    .from("associations")
    .delete()
    .eq("id", associationId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/list");
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient();

  const { count: playerCount } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (playerCount && playerCount > 0) {
    redirect(
      `/associations?error=${encodeURIComponent(
        `Can't delete this team — it has ${playerCount} player${playerCount === 1 ? "" : "s"} on its roster (including any submitted waivers). Remove the roster first.`,
      )}`,
    );
  }

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}
